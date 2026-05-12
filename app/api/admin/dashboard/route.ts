import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/lib/server/api-error";
import { getOptionalAdminDb } from "@/lib/server/firebase-admin";
import { getCurrentApprovalStep } from "@/lib/reservations/reservation-approval";
import { groupReservationsForDisplay } from "@/lib/reservations/reservation-groups";
import { getRequestAuthContext } from "@/lib/server/request-auth";
import { createReservationDocumentSignedUrl } from "@/lib/server/supabase-storage";
import {
  assertAuthenticated,
  assertCanManageBuilding,
} from "@/lib/server/route-guards";

type DashboardAdminRequest = {
  createdAt?: unknown;
  id: string;
} & Record<string, unknown>;

type DashboardNotification = {
  createdAt?: unknown;
  id: string;
} & Record<string, unknown>;

type DashboardReservation = {
  approvalFlow?: unknown;
  createdAt?: unknown;
  currentStep?: number;
  date?: string;
  id: string;
  startTime?: string;
  status?: string;
} & Record<string, unknown>;

type DashboardRoom = {
  buildingName?: string;
  floor?: string;
  id: string;
  name?: string;
} & Record<string, unknown>;

type DashboardRoomHistoryEntry = {
  createdAt?: unknown;
  id: string;
} & Record<string, unknown>;

type DashboardSchedule = {
  dayOfWeek?: number;
  id: string;
  roomName?: string;
  startTime?: string;
} & Record<string, unknown>;

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

function isVisiblePendingReservationForBuildingAdmin(
  reservation: DashboardReservation
) {
  if (reservation.status !== "pending") {
    return false;
  }

  const currentStep = getCurrentApprovalStep(
    Array.isArray(reservation.approvalFlow) ? reservation.approvalFlow : undefined,
    typeof reservation.currentStep === "number" ? reservation.currentStep : undefined
  );

  return currentStep?.role === "building_admin";
}

function parseBooleanFlag(value: string | null, defaultValue: boolean) {
  if (value === null) {
    return defaultValue;
  }

  return value !== "false";
}

async function getApprovalDocumentUrl(reservation: DashboardReservation) {
  const storedUrl =
    typeof reservation.approvalDocumentUrl === "string"
      ? reservation.approvalDocumentUrl
      : null;

  try {
    return (
      (await createReservationDocumentSignedUrl({
      path:
        typeof reservation.approvalDocumentPath === "string"
          ? reservation.approvalDocumentPath
          : null,
      })) ?? storedUrl
    );
  } catch (error) {
    console.warn("Failed to resolve reservation approval document URL", {
      error,
      reservationId: reservation.id,
    });
    return storedUrl;
  }
}

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getRequestAuthContext(request);
    assertAuthenticated(authContext);

    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get("buildingId")?.trim() ?? "";
    const includeRooms = parseBooleanFlag(searchParams.get("includeRooms"), true);
    const includeApprovedReservations = parseBooleanFlag(
      searchParams.get("includeApprovedReservations"),
      true
    );
    const includePendingRequests = parseBooleanFlag(
      searchParams.get("includePendingRequests"),
      true
    );
    const includeSchedules = parseBooleanFlag(
      searchParams.get("includeSchedules"),
      true
    );
    const includeRoomHistory = parseBooleanFlag(
      searchParams.get("includeRoomHistory"),
      true
    );

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
      approvedReservationsSnapshot,
      pendingReservationsSnapshot,
      schedulesSnapshot,
      roomHistorySnapshot,
    ] = await Promise.all([
      includeRooms
        ? adminDb.collection("rooms").where("buildingId", "==", buildingId).get()
        : Promise.resolve(null),
      includeApprovedReservations
        ? adminDb
            .collection("reservations")
            .where("buildingId", "==", buildingId)
            .where("status", "==", "approved")
            .get()
        : Promise.resolve(null),
      includePendingRequests
        ? adminDb
            .collection("reservations")
            .where("buildingId", "==", buildingId)
            .where("status", "==", "pending")
            .get()
        : Promise.resolve(null),
      includeSchedules
        ? adminDb.collection("schedules").where("buildingId", "==", buildingId).get()
        : Promise.resolve(null),
      includeRoomHistory
        ? adminDb.collection("roomHistory").where("buildingId", "==", buildingId).get()
        : Promise.resolve(null),
    ]);

    const rooms = roomsSnapshot
      ? roomsSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as DashboardRoom)
          .sort(sortRooms)
      : [];
    const allReservations = (approvedReservationsSnapshot?.docs ?? [])
      .map((doc) => ({ id: doc.id, ...doc.data() }) as DashboardReservation)
      .sort(sortReservations);
    const pendingRequests = (pendingReservationsSnapshot?.docs ?? [])
      .map((doc) => ({ id: doc.id, ...doc.data() }) as DashboardReservation)
      .filter(isVisiblePendingReservationForBuildingAdmin);
    const requests = groupReservationsForDisplay(
      await Promise.all(
        pendingRequests
          .sort(sortReservations)
          .map(async (reservation) => ({
            ...reservation,
            approvalDocumentUrl: await getApprovalDocumentUrl(reservation),
          }))
      )
    );
    const schedules = (schedulesSnapshot?.docs ?? [])
      .map((doc) => ({ id: doc.id, ...doc.data() }) as DashboardSchedule)
      .sort(sortSchedules);
    const roomHistory = (roomHistorySnapshot?.docs ?? [])
      .map((doc) => ({ id: doc.id, ...doc.data() }) as DashboardRoomHistoryEntry)
      .sort(sortByCreatedAtDesc);

    return NextResponse.json({
      adminRequests: [] as DashboardAdminRequest[],
      allReservations,
      notifications: [] as DashboardNotification[],
      requests,
      roomHistory,
      rooms,
      schedules,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
