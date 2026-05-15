'use client';

import { useState } from 'react';
import {
  resolveFeedbackSentimentLabel,
  type FeedbackSentimentSummary,
} from '@/lib/feedback/feedback-sentiment';
import { respondToFeedback, type Feedback } from '@/lib/feedback/feedback';
import {
  formatSentimentLabel,
  getSentimentBadgeClasses,
  StarRating,
} from './shared';

interface AdminFeedbackTabProps {
  feedbackList: Feedback[];
  feedbackSummary: FeedbackSentimentSummary | null;
  onReload: () => Promise<void>;
}

export default function AdminFeedbackTab({
  feedbackList,
  feedbackSummary,
  onReload,
}: Readonly<AdminFeedbackTabProps>) {
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  const handleRespondFeedback = async (feedbackId: string) => {
    if (!responseText.trim()) {
      return;
    }

    try {
      await respondToFeedback(feedbackId, responseText.trim());
      setRespondingId(null);
      setResponseText('');
      await onReload();
    } catch (error) {
      console.warn('Failed to respond:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 bg-white rounded-xl px-6 py-4 border border-white/30">
        <h3 className="text-xl font-bold text-gray-800">Room Feedback</h3>
        <span className="text-sm text-gray-600">{feedbackList.length} total</span>
      </div>

      {feedbackList.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-3">Feedback</div>
          <h4 className="text-lg font-bold text-black mb-1">No Feedback Yet</h4>
          <p className="text-sm text-black">Feedback from room users will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbackSummary && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="glass-card p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-black">Positive</p>
                <p className="mt-2 text-2xl font-bold text-green-700">
                  {feedbackSummary.positivePercentage.toFixed(1)}%
                </p>
                <p className="text-xs text-black">
                  {feedbackSummary.positiveCount} of {feedbackSummary.total} entries
                </p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-black">Neutral</p>
                <p className="mt-2 text-2xl font-bold text-slate-700">
                  {feedbackSummary.neutralPercentage.toFixed(1)}%
                </p>
                <p className="text-xs text-black">
                  {feedbackSummary.neutralCount} of {feedbackSummary.total} entries
                </p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-black">Negative</p>
                <p className="mt-2 text-2xl font-bold text-red-700">
                  {feedbackSummary.negativePercentage.toFixed(1)}%
                </p>
                <p className="text-xs text-black">
                  {feedbackSummary.negativeCount} of {feedbackSummary.total} entries
                </p>
              </div>
              <div className="glass-card p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-black">
                  Average Compound
                </p>
                <p className="mt-2 text-2xl font-bold text-black">
                  {feedbackSummary.averageCompoundScore.toFixed(2)}
                </p>
                <p className="text-xs text-black">
                  {formatSentimentLabel(
                    resolveFeedbackSentimentLabel({
                      compoundScore: feedbackSummary.averageCompoundScore,
                    })
                  )}
                </p>
              </div>
            </div>
          )}

          {feedbackList.map((feedback) => (
            <div key={feedback.id} className="glass-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-dark/5 border border-dark/10 flex items-center justify-center text-black font-bold text-sm">
                    {feedback.userName
                      .split(' ')
                      .map((name) => name[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-black text-sm">{feedback.userName}</h4>
                    <p className="text-xs text-black">
                      {feedback.roomName} | {feedback.buildingName}
                    </p>
                  </div>
                </div>
                <StarRating rating={feedback.rating} />
              </div>

              <div className="mb-3 rounded-xl border border-dark/10 bg-dark/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-black">
                      Sentiment Analysis
                    </p>
                    <p className="mt-1 text-sm text-black">
                      {formatSentimentLabel(resolveFeedbackSentimentLabel(feedback))}
                      {typeof feedback.compoundScore === 'number'
                        ? ` (${feedback.compoundScore.toFixed(2)})`
                        : ''}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${getSentimentBadgeClasses(
                      resolveFeedbackSentimentLabel(feedback)
                    )}`}
                  >
                    {formatSentimentLabel(resolveFeedbackSentimentLabel(feedback))}
                  </span>
                </div>

                {typeof feedback.compoundScore === 'number' &&
                  typeof feedback.positiveScore === 'number' &&
                  typeof feedback.neutralScore === 'number' &&
                  typeof feedback.negativeScore === 'number' && (
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-black sm:grid-cols-4">
                      <div>
                        <p className="font-bold">Compound</p>
                        <p>{feedback.compoundScore.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="font-bold">Positive</p>
                        <p>{Math.round(feedback.positiveScore * 100)}%</p>
                      </div>
                      <div>
                        <p className="font-bold">Neutral</p>
                        <p>{Math.round(feedback.neutralScore * 100)}%</p>
                      </div>
                      <div>
                        <p className="font-bold">Negative</p>
                        <p>{Math.round(feedback.negativeScore * 100)}%</p>
                      </div>
                    </div>
                  )}
              </div>

              <p className="text-sm text-black mb-3 leading-relaxed">{feedback.message}</p>

              {feedback.adminResponse ? (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mt-3">
                  <p className="text-xs font-bold text-primary mb-1">Admin Response</p>
                  <p className="text-sm text-black">{feedback.adminResponse}</p>
                </div>
              ) : respondingId === feedback.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={responseText}
                    onChange={(event) => setResponseText(event.target.value)}
                    placeholder="Type your response..."
                    className="glass-input w-full px-4 py-3 text-sm resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setRespondingId(null);
                        setResponseText('');
                      }}
                      className="px-4 py-2 rounded-xl text-sm font-bold bg-dark/5 text-black border border-dark/10 hover:bg-primary/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRespondFeedback(feedback.id)}
                      disabled={!responseText.trim()}
                      className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
                    >
                      Send Response
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setRespondingId(feedback.id)}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-primary/70 hover:text-primary hover:bg-primary/5 border border-primary/20 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Reply
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
