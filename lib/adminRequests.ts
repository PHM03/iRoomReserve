import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  getDocs,
  Unsubscribe,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { createNotification } from "./notifications";

// ─── Types ──────────────────────────────────────────────────────
export interface AdminRequest {
  id: string;
  userId: string;
  userName: string;
  reservationId: string | null;
  type: "equipment" | "general" | "other";
  subject: string;
  message: string;
  status: "open" | "responded" | "closed";
  adminResponse: string | null;
  buildingId: string;
  buildingName: string;
  createdAt?: Timestamp;
}

export type AdminRequestInput = Omit<AdminRequest, "id" | "status" | "adminResponse" | "createdAt">;

// ─── Create Admin Request ───────────────────────────────────────
export async function createAdminRequest(data: AdminRequestInput): Promise<string> {
  const docRef = await addDoc(collection(db, "adminRequests"), {
    ...data,
    status: "open",
    adminResponse: null,
    createdAt: serverTimestamp(),
  });

  // Notify all admins/staff assigned to this building
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
      title: "New Admin Request",
      message: `${data.userName}: ${data.subject} — "${data.message.slice(0, 60)}${data.message.length > 60 ? '...' : ''}"`,
      buildingId: data.buildingId,
      reservationId: docRef.id,
    });
  }

  return docRef.id;
}

// ─── Real-time Admin Requests by User ───────────────────────────
export function onAdminRequestsByUser(
  userId: string,
  callback: (requests: AdminRequest[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "adminRequests"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const requests: AdminRequest[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    } as AdminRequest));
    callback(requests);
  }, (error) => {
    console.warn('Firestore listener error (admin requests by user):', error);
  });
}
