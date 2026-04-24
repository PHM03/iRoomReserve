import "server-only";

import { analyzeSentiment, getSentimentLabel } from "@/lib/sentiment";
import { db, serverTimestamp } from "@/lib/configs/firebase-admin";
import { getAssignedManagerIds } from "@/lib/server/services/building-managers";

export interface FeedbackCreateInput {
  roomId: string;
  roomName: string;
  buildingId: string;
  buildingName: string;
  reservationId: string;
  userId: string;
  userName: string;
  message: string;
  rating: number;
}

export async function createFeedbackRecord(data: FeedbackCreateInput) {
  const adminIds = await getAssignedManagerIds(data.buildingId);
  const feedbackText = data.message.trim();
  const sentiment = analyzeSentiment(feedbackText);
  const sentimentLabel = getSentimentLabel(sentiment.compound);

  const feedbackRef = db.collection("feedback").doc();
  const batch = db.batch();

  batch.set(feedbackRef, {
    ...data,
    text: feedbackText,
    message: feedbackText,
    compoundScore: sentiment.compound,
    positiveScore: sentiment.positive,
    neutralScore: sentiment.neutral,
    negativeScore: sentiment.negative,
    sentimentLabel,
    adminResponse: null,
    respondedAt: null,
    createdAt: serverTimestamp(),
  });

  adminIds.forEach((adminUid) => {
    const notificationRef = db.collection("notifications").doc();
    batch.set(notificationRef, {
      recipientUid: adminUid,
      type: "feedback",
      title: "New Room Feedback",
      message: `${data.userName} left feedback for ${data.roomName}: "${feedbackText.slice(
        0,
        60
      )}${feedbackText.length > 60 ? "..." : ""}"`,
      buildingId: data.buildingId,
      reservationId: feedbackRef.id,
      read: false,
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();
  return feedbackRef.id;
}

export async function respondToFeedbackRecord(feedbackId: string, response: string) {
  const batch = db.batch();
  batch.update(db.collection("feedback").doc(feedbackId), {
    adminResponse: response,
    respondedAt: serverTimestamp(),
  });
  await batch.commit();
}
