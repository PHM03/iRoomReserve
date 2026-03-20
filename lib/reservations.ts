import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { createNotification } from "./notifications";
import { addRoomHistoryEntry } from "./roomHistory";

// ─── Types ──────────────────────────────────────────────────────
export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  roomId: string;
  roomName: string;
  buildingId: string;
  buildingName: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  equipment?: Record<string, number>;
  endorsedByEmail?: string;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  adminUid: string | null;
  recurringGroupId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type ReservationInput = Omit<Reservation, "id" | "status" | "adminUid" | "createdAt" | "updatedAt">;

// ─── Create Reservation ─────────────────────────────────────────
export async function createReservation(
  data: ReservationInput
): Promise<string> {
  // 1. Find ALL admins/staff assigned to this building
  const adminsQuery = query(
    collection(db, "users"),
    where("assignedBuildingId", "==", data.buildingId),
    where("status", "==", "approved")
  );
  const adminsSnap = await getDocs(adminsQuery);
  const adminUids = adminsSnap.docs.map((d) => d.id);

  // 2. Create the reservation document
  const docRef = await addDoc(collection(db, "reservations"), {
    ...data,
    status: "pending",
    adminUid: adminUids[0] || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // 3. Notify ALL assigned admins/staff for this building
  for (const uid of adminUids) {
    await createNotification({
      recipientUid: uid,
      type: "new_reservation",
      title: "New Reservation Request",
      message: `${data.userName} reserved ${data.roomName} on ${data.date} (${data.startTime} – ${data.endTime})`,
      buildingId: data.buildingId,
      reservationId: docRef.id,
    });
  }

  return docRef.id;
}

// ─── Helpers for Recurring Reservations ─────────────────────────
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDatesForDays(
  startDate: string,
  endDate: string,
  selectedDays: number[] // 0=Sun … 6=Sat
): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

  while (current <= end) {
    if (selectedDays.includes(current.getDay())) {
      dates.push(current.toISOString().split("T")[0]);
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// ─── Create Recurring Reservation ───────────────────────────────
export async function createRecurringReservation(
  data: Omit<ReservationInput, "date">,
  selectedDays: number[],
  startDate: string,
  endDate: string
): Promise<string[]> {
  const dates = getDatesForDays(startDate, endDate, selectedDays);
  if (dates.length === 0) throw new Error("No matching dates found for the selected days.");

  // Generate a group ID to link all recurring reservations
  const groupId = `recurring_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Find admins once
  const adminsQuery = query(
    collection(db, "users"),
    where("assignedBuildingId", "==", data.buildingId),
    where("status", "==", "approved")
  );
  const adminsSnap = await getDocs(adminsQuery);
  const adminUids = adminsSnap.docs.map((d) => d.id);

  const createdIds: string[] = [];

  for (const date of dates) {
    const docRef = await addDoc(collection(db, "reservations"), {
      ...data,
      date,
      status: "pending",
      adminUid: adminUids[0] || null,
      recurringGroupId: groupId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    createdIds.push(docRef.id);
  }

  // Send a single summary notification to each admin
  const dayNames = selectedDays.map((d) => DAY_LABELS[d]).join(", ");
  for (const uid of adminUids) {
    await createNotification({
      recipientUid: uid,
      type: "new_reservation",
      title: "New Recurring Reservation",
      message: `${data.userName} reserved ${data.roomName} every ${dayNames} from ${startDate} to ${endDate} (${data.startTime} – ${data.endTime}) — ${dates.length} dates`,
      buildingId: data.buildingId,
      reservationId: createdIds[0],
    });
  }

  return createdIds;
}

// ─── Real-time Pending Reservations by Building ─────────────────
export function onPendingReservationsByBuilding(
  buildingId: string,
  callback: (reservations: Reservation[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "reservations"),
    where("buildingId", "==", buildingId),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const reservations: Reservation[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    } as Reservation));
    callback(reservations);
  }, (error) => {
    console.warn('Firestore listener error (pending reservations):', error);
  });
}

// ─── Real-time All Reservations by Building ─────────────────────
export function onReservationsByBuilding(
  buildingId: string,
  callback: (reservations: Reservation[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "reservations"),
    where("buildingId", "==", buildingId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const reservations: Reservation[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    } as Reservation));
    callback(reservations);
  }, (error) => {
    console.warn('Firestore listener error (reservations by building):', error);
  });
}

// ─── Real-time Reservations by User ─────────────────────────────
export function onReservationsByUser(
  userId: string,
  callback: (reservations: Reservation[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "reservations"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const reservations: Reservation[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    } as Reservation));
    callback(reservations);
  }, (error) => {
    console.warn('Firestore listener error (reservations by user):', error);
  });
}

// ─── Approve Reservation ────────────────────────────────────────
export async function approveReservation(
  reservationId: string
): Promise<void> {
  const reservationRef = doc(db, "reservations", reservationId);
  const snap = await getDoc(reservationRef);

  await updateDoc(reservationRef, {
    status: "approved",
    updatedAt: serverTimestamp(),
  });

  // Notify the student
  if (snap.exists()) {
    const data = snap.data();
    await createNotification({
      recipientUid: data.userId,
      type: "reservation_approved",
      title: "Reservation Approved",
      message: `Your reservation for ${data.roomName} on ${data.date} has been approved.`,
      buildingId: data.buildingId,
      reservationId,
    });

    // Log to room history
    await addRoomHistoryEntry({
      roomId: data.roomId,
      roomName: data.roomName,
      buildingId: data.buildingId,
      userName: data.userName,
      userRole: data.userRole || "Student",
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      type: "reservation",
      purpose: data.purpose,
      sourceId: reservationId,
      status: "approved",
    });
  }
}

// ─── Reject Reservation ─────────────────────────────────────────
export async function rejectReservation(
  reservationId: string
): Promise<void> {
  const reservationRef = doc(db, "reservations", reservationId);
  const snap = await getDoc(reservationRef);

  await updateDoc(reservationRef, {
    status: "rejected",
    updatedAt: serverTimestamp(),
  });

  // Notify the student
  if (snap.exists()) {
    const data = snap.data();
    await createNotification({
      recipientUid: data.userId,
      type: "reservation_rejected",
      title: "Reservation Rejected",
      message: `Your reservation for ${data.roomName} on ${data.date} has been rejected.`,
      buildingId: data.buildingId,
      reservationId,
    });
  }
}

// ─── Cancel Reservation (by User) ───────────────────────────────
export async function cancelReservation(
  reservationId: string,
  userId: string
): Promise<void> {
  const reservationRef = doc(db, "reservations", reservationId);
  const snap = await getDoc(reservationRef);

  if (!snap.exists()) throw new Error("Reservation not found");

  const data = snap.data();

  // Validate ownership
  if (data.userId !== userId) throw new Error("Not authorized to cancel this reservation");

  // Only pending or approved reservations can be cancelled
  if (data.status !== "pending" && data.status !== "approved") {
    throw new Error("Only pending or approved reservations can be cancelled");
  }

  await updateDoc(reservationRef, {
    status: "cancelled",
    updatedAt: serverTimestamp(),
  });

  // Notify building admins
  const adminsQuery = query(
    collection(db, "users"),
    where("assignedBuildingId", "==", data.buildingId),
    where("status", "==", "approved")
  );
  const adminsSnap = await getDocs(adminsQuery);

  for (const adminDoc of adminsSnap.docs) {
    await createNotification({
      recipientUid: adminDoc.id,
      type: "reservation_cancelled",
      title: "Reservation Cancelled",
      message: `${data.userName} cancelled their reservation for ${data.roomName} on ${data.date} (${data.startTime} – ${data.endTime})`,
      buildingId: data.buildingId,
      reservationId,
    });
  }
}

// ─── Complete Reservation (by User) ─────────────────────────────
export async function completeReservation(
  reservationId: string,
  userId: string
): Promise<void> {
  const reservationRef = doc(db, "reservations", reservationId);
  const snap = await getDoc(reservationRef);

  if (!snap.exists()) throw new Error("Reservation not found");

  const data = snap.data();

  // Validate ownership
  if (data.userId !== userId) throw new Error("Not authorized to complete this reservation");

  // Only approved reservations can be marked as completed
  if (data.status !== "approved") {
    throw new Error("Only approved reservations can be marked as completed");
  }

  await updateDoc(reservationRef, {
    status: "completed",
    updatedAt: serverTimestamp(),
  });

  // Notify building admins
  const adminsQuery = query(
    collection(db, "users"),
    where("assignedBuildingId", "==", data.buildingId),
    where("status", "==", "approved")
  );
  const adminsSnap = await getDocs(adminsQuery);

  for (const adminDoc of adminsSnap.docs) {
    await createNotification({
      recipientUid: adminDoc.id,
      type: "system",
      title: "Reservation Completed",
      message: `${data.userName} marked their reservation for ${data.roomName} on ${data.date} as completed.`,
      buildingId: data.buildingId,
      reservationId,
    });
  }

  // Log to room history
  await addRoomHistoryEntry({
    roomId: data.roomId,
    roomName: data.roomName,
    buildingId: data.buildingId,
    userName: data.userName,
    userRole: data.userRole || "Student",
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    type: "reservation",
    purpose: data.purpose,
    sourceId: reservationId,
    status: "completed",
  });
}
