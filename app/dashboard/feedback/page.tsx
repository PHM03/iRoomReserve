'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  onReservationsByUser,
  Reservation,
} from '@/lib/reservations';
import {
  createFeedback,
  onFeedbackByUser,
  Feedback,
} from '@/lib/feedback';

export default function FeedbackPage() {
  const { firebaseUser, profile } = useAuth();

  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsubFeedback = onFeedbackByUser(firebaseUser.uid, setFeedbackList);
    const unsubReservations = onReservationsByUser(firebaseUser.uid, setReservations);
    return () => {
      unsubFeedback();
      unsubReservations();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser?.uid]);

  // Completed reservations that don't have feedback yet
  const completedReservations = reservations.filter((r) => r.status === 'completed');
  const feedbackReservationIds = new Set(feedbackList.map((f) => f.reservationId));
  const pendingFeedback = completedReservations.filter((r) => !feedbackReservationIds.has(r.id));

  const handleOpenFeedback = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowForm(true);
    setRating(0);
    setComment('');
    setSubmitSuccess(false);
  };

  const handleSubmit = async () => {
    if (!firebaseUser || !selectedReservation || rating === 0 || !comment.trim()) return;
    setSubmitting(true);
    try {
      const displayName = firebaseUser.displayName || profile?.firstName || 'User';
      await createFeedback({
        roomId: selectedReservation.roomId,
        roomName: selectedReservation.roomName,
        buildingId: selectedReservation.buildingId,
        buildingName: selectedReservation.buildingName,
        reservationId: selectedReservation.id,
        userId: firebaseUser.uid,
        userName: displayName,
        message: comment.trim(),
        rating,
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setShowForm(false);
        setSubmitSuccess(false);
        setSelectedReservation(null);
        setRating(0);
        setComment('');
      }, 2000);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
    setSubmitting(false);
  };

  const renderStars = (count: number, size = 'w-4 h-4') => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`${size} ${i < count ? 'text-yellow-400' : 'text-white/10'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 pb-24 md:pb-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Feedback</h2>
        <p className="text-white/40 mt-1">Rate your experience and help us improve</p>
      </div>

      {/* Pending Feedback Prompt */}
      {pendingFeedback.length > 0 && !showForm && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            Rate Your Experience
          </h3>
          <div className="space-y-3">
            {pendingFeedback.map((r) => (
              <div key={r.id} className="glass-card p-4 !rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">{r.roomName}</h4>
                  <p className="text-xs text-white/40">{r.buildingName} · {r.date} · {r.startTime} – {r.endTime}</p>
                </div>
                <button
                  onClick={() => handleOpenFeedback(r)}
                  className="btn-primary px-4 py-2 text-xs"
                >
                  Rate Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Form */}
      {showForm && selectedReservation && (
        <div className="glass-card p-6 !rounded-2xl mb-8">
          {submitSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Feedback Submitted!</h3>
              <p className="text-sm text-white/40">Thank you for your feedback.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Rate Your Experience</h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    {selectedReservation.roomName} · {selectedReservation.buildingName} · {selectedReservation.date}
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-bold text-white/70 mb-3">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <svg
                          className={`w-8 h-8 ${
                            star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-white/15'
                          } transition-colors`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="text-xs text-white/30 mt-1">
                      {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
                    </p>
                  )}
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-bold text-white/70 mb-1.5">Comments</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="glass-input w-full px-4 py-3 min-h-[120px] resize-none"
                    placeholder="Share your experience with this room..."
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || rating === 0 || !comment.trim()}
                  className="btn-primary w-full py-3 px-4 flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Past Feedback */}
      <h3 className="text-xl font-bold text-white mb-4">Your Feedback</h3>
      <div className="space-y-4">
        {feedbackList.length === 0 ? (
          <div className="glass-card p-12 !rounded-xl text-center">
            <svg className="w-14 h-14 text-white/8 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="text-sm text-white/30 font-bold">No feedback yet</p>
            <p className="text-xs text-white/15 mt-1">Your submitted feedback will appear here</p>
          </div>
        ) : (
          feedbackList.map((fb) => (
            <div key={fb.id} className="glass-card p-5 !rounded-xl">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-white">{fb.roomName}</h4>
                  <p className="text-xs text-white/30">{fb.buildingName}</p>
                </div>
                <div className="flex">
                  {renderStars(fb.rating)}
                </div>
              </div>
              <p className="text-sm text-white/50 mb-3">{fb.message}</p>
              {fb.adminResponse && (
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-xs font-bold text-primary mb-1">Admin Response</p>
                  <p className="text-sm text-white/60">{fb.adminResponse}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
