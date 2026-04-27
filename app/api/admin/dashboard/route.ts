import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/lib/server/api-error";
import { getOptionalAdminDb } from "@/lib/server/firebase-admin";
import { getRequestAuthContext } from "@/lib/server/request-auth";
import {
  assertAuthenticated,
  assertCanManageBuilding,
} from "@/lib/server/route-guards";

function getTimestampSeconds(value: unknown) {
  if (!value || typeof value !== "object") {
    return 0;
  }

  const candidate = value as {
    seconds?: unknown;
    _seconds?: unknown;
  };

  if (typeof candidate.seconds === "number") {
    return candidate.seconds;
  }

  if (typeof candidate._seconds === "number") {
    return candidate._seconds;
  }

  return 0;
}

function sortByCreatedAtDesc<T extends { id: string; createdAt?: unknown }>(
  left: T,
  right: T
) {
  const leftSeconds = getTimestampSeconds(left.createdAt);
  const rightSeconds = getTimestampSeconds(right.createdAt);

  return rightSeconds - leftSeconds || left.id.localeCompare(right.id);
}

function sortRooms<
  T extends {
    buildingName?: string;
    floor?: string;
    name?: string;
  },
>(left: T, right: T) {
  return (
    (left.buildingName ?? "").localeCompare(right.buildingName ?? "") ||
    (left.floor ?? "").localeCompare(right.floor ?? "") ||
    (left.name ?? "").localeCompare(right.name ?? "")
  );
}

function sortSchedules<
  T extends {
    dayOfWeek?: number;
    startTime?: string;
    roomName?: string;
  },
>(left: T, right: T) {
  return (
    (left.dayOfWeek ?? 0) - (right.dayOfWeek ?? 0) ||
    (left.startTime ?? "").localeCompare(right.startTime ?? "") ||
    (left.roomName ?? "").localeCompare(right.roomName ?? "")
  );
}

function sortReservations<
  T extends {
    id: string;
    date?: string;
    startTime?: string;
    createdAt?: unknown;
  },
>(left: T, right: T) {
  const createdAtOrder = sortByCreatedAtDesc(left, right);
  if (createdAtOrder !== 0) {
    return createdAtOrder;
  }

  return (
    (right.date ?? "").localeCompare(left.date ?? "") ||
    (right.startTime ?? "").localeCompare(left.startTime ?? "") ||
    right.id.localeCompare(left.id)
  );
}

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getRequestAuthContext(request);
    assertAuthenticated(authContext);

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get("buildingId")?.trim() ?? "";

    if (!buildingId) {
      return NextResponse.json(
        { error: { code: "missing_building_id", message: "buildingId is required." } },
        { status: 400 }
      );
    }

    assertCanManageBuilding(authContext, buildingId);

    const adminDb = getOptionalAdminDb();
    if (!adminDb) {
      throw new Error(
        "Firebase Admin Firestore is not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY."
      );
    }

    const [
      roomsSnapshot,
      reservationsSnapshot,
      feedbackSnapshot,
      notificationsSnapshot,
      schedulesSnapshot,
      roomHistorySnapshot,
      adminRequestsSnapshot,
    ] = await Promise.all([
      adminDb.collection("rooms").where("buildingId", "==", buildingId).get(),
      adminDb.collection("reservations").where("buildingId", "==", buildingId).get(),
      adminDb.collection("feedback").where("buildingId", "==", buildingId).get(),
      adminDb
        .collection("notifications")
        .where("recipientUid", "==", authContext.uid)
        .where("read", "==", false)
        .get(),
      adminDb.collection("schedules").where("buildingId", "==", buildingId).get(),
      adminDb.collection("roomHistory").where("buildingId", "==", buildingId).get(),
      adminDb.collection("adminRequests").where("buildingId", "==", buildingId).get(),
    ]);

    const rooms = roomsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort(sortRooms);
    const allReservations = reservationsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort(sortReservations);
    const requests = allReservations.filter(
      (reservation) => reservation.status === "pending"
    );
    const feedbackList = feedbackSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort(sortByCreatedAtDesc);
    const notifications = notificationsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort(sortByCreatedAtDesc);
    const schedules = schedulesSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort(sortSchedules);
    const roomHistory = roomHistorySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort(sortByCreatedAtDesc);
    const adminRequests = adminRequestsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort(sortByCreatedAtDesc);

    return NextResponse.json({
      adminRequests,
      allReservations,
      feedbackList,
      notifications,
      requests,
      roomHistory,
      rooms,
      schedules,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
