import {
  averageSentimentScores,
  getSentimentLabel,
  type SentimentLabel,
} from "./sentiment";

export interface FeedbackSentimentFields {
  compoundScore?: number | null;
  positiveScore?: number | null;
  neutralScore?: number | null;
  negativeScore?: number | null;
  sentimentLabel?: SentimentLabel | null;
}

export interface FeedbackSentimentSummary {
  averageCompoundScore: number;
  negativeCount: number;
  negativePercentage: number;
  neutralCount: number;
  neutralPercentage: number;
  positiveCount: number;
  positivePercentage: number;
  total: number;
}

function isSentimentLabel(value: unknown): value is SentimentLabel {
  return value === "positive" || value === "neutral" || value === "negative";
}

function toPercentage(count: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Number(((count / total) * 100).toFixed(1));
}

export function resolveFeedbackSentimentLabel(
  feedback: FeedbackSentimentFields
): SentimentLabel {
  if (isSentimentLabel(feedback.sentimentLabel)) {
    return feedback.sentimentLabel;
  }

  if (typeof feedback.compoundScore === "number") {
    return getSentimentLabel(feedback.compoundScore);
  }

  return "neutral";
}

export function summarizeFeedbackSentiment(
  feedbackItems: FeedbackSentimentFields[]
): FeedbackSentimentSummary {
  const summary = {
    averageCompoundScore: 0,
    negativeCount: 0,
    negativePercentage: 0,
    neutralCount: 0,
    neutralPercentage: 0,
    positiveCount: 0,
    positivePercentage: 0,
    total: feedbackItems.length,
  };

  if (feedbackItems.length === 0) {
    return summary;
  }

  feedbackItems.forEach((feedback) => {
    const sentimentLabel = resolveFeedbackSentimentLabel(feedback);

    if (sentimentLabel === "positive") {
      summary.positiveCount += 1;
      return;
    }

    if (sentimentLabel === "negative") {
      summary.negativeCount += 1;
      return;
    }

    summary.neutralCount += 1;
  });

  summary.averageCompoundScore = Number(
    averageSentimentScores(
      feedbackItems.map((feedback) => feedback.compoundScore ?? null)
    ).toFixed(3)
  );
  summary.positivePercentage = toPercentage(
    summary.positiveCount,
    summary.total
  );
  summary.neutralPercentage = toPercentage(
    summary.neutralCount,
    summary.total
  );
  summary.negativePercentage = toPercentage(
    summary.negativeCount,
    summary.total
  );

  return summary;
}
