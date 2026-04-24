import "server-only";

import { db, serverTimestamp } from "@/lib/configs/firebase-admin";
import { getAssignedManagerIds } from "@/lib/server/services/building-managers";

export interface AdminRequestCreateInput {
  userId: string;
  userName: string;
  reservationId: string | null;
  type: "equipment" | "general" | "other";
  subject: string;
  message: string;
  buildingId: string;
  buildingName: string;
}

export async function createAdminRequestRecord(data: AdminRequestCreateInput) {
  const adminIds = await getAssignedManagerIds(data.buildingId);

  const requestRef = db.collection("adminRequests").doc();
  const batch = db.batch();

  batch.set(requestRef, {
    ...data,
    status: "open",
    adminResponse: null,
    createdAt: serverTimestamp(),
  });

  adminIds.forEach((adminUid) => {
    const notificationRef = db.collection("notifications").doc();
    batch.set(notificationRef, {
      recipientUid: adminUid,
      type: "system",
      title: "New Admin Request",
      message: `${data.userName}: ${data.subject} - "${data.message.slice(0, 60)}${
        data.message.length > 60 ? "..." : ""
      }"`,
      buildingId: data.buildingId,
      reservationId: requestRef.id,
      read: false,
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();
  return requestRef.id;
}

export async function respondToAdminRequestRecord(
  requestId: string,
  responseText: string
) {
  const requestRef = db.collection("adminRequests").doc(requestId);
  const requestSnapshot = await requestRef.get();
  if (!requestSnapshot.exists) {
    throw new Error("Admin request not found.");
  }

  const requestData = requestSnapshot.data() as {
    userId: string;
    subject: string;
    buildingId: string;
  };

  const batch = db.batch();
  batch.update(requestRef, {
    adminResponse: responseText,
    status: "responded",
  });

  const notificationRef = db.collection("notifications").doc();
  batch.set(notificationRef, {
    recipientUid: requestData.userId,
    type: "system",
    title: "Admin Replied",
    message: `Your request "${requestData.subject}" received a response: "${responseText.slice(
      0,
      80
    )}${responseText.length > 80 ? "..." : ""}"`,
    buildingId: requestData.buildingId,
    reservationId: requestId,
    read: false,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
}
