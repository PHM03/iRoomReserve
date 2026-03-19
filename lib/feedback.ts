import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import { createNotification } from "./notifications";

// ─── Types ──────────────────────────────────────────────────────
export interface Feedback {
  id: string;
  roomId: string;
  roomName: string;
  buildingId: string;
  buildingName: string;
  userId: string;
  userName: string;
  message: string;
  rating: number; // 1-5
  adminResponse: string | null;
  respondedAt?: Timestamp | null;
  createdAt?: Timestamp;
}

export type FeedbackInput = Omit<Feedback, "id" | "adminResponse" | "respondedAt" | "createdAt">;

// ─── Create Feedback ────────────────────────────────────────────
export async function createFeedback(data: FeedbackInput): Promise<string> {
  const docRef = await addDoc(collection(db, "feedback"), {
    ...data,
    adminResponse: null,
    respondedAt: null,
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
      type: "feedback",
      title: "New Room Feedback",
      message: `${data.userName} left feedback for ${data.roomName}: "${data.message.slice(0, 60)}${data.message.length > 60 ? '...' : ''}"`,
      buildingId: data.buildingId,
      reservationId: docRef.id,
    });
  }

  return docRef.id;
}

// ─── Real-time Feedback by Building ─────────────────────────────
export function onFeedbackByBuilding(
  buildingId: string,
  callback: (feedback: Feedback[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "feedback"),
    where("buildingId", "==", buildingId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const items: Feedback[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    } as Feedback));
    callback(items);
  }, (error) => {
    console.warn('Firestore listener error (feedback):', error);
  });
}

// ─── Respond to Feedback ────────────────────────────────────────
export async function respondToFeedback(
  feedbackId: string,
  response: string
): Promise<void> {
  await updateDoc(doc(db, "feedback", feedbackId), {
    adminResponse: response,
    respondedAt: serverTimestamp(),
  });
}
