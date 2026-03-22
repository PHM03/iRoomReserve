'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  AdminRequest,
  onAdminRequestsByBuilding,
  respondToAdminRequest,
} from '@/lib/adminRequests';

export default function InboxPage() {
  const { firebaseUser, profile } = useAuth();
  const buildingId = profile?.assignedBuildingId;
  const buildingName = profile?.assignedBuilding;

  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'responded' | 'closed'>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!buildingId || !firebaseUser) return;
    const unsub = onAdminRequestsByBuilding(buildingId, setRequests);
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildingId, firebaseUser?.uid]);

  const filteredRequests = filter === 'all'
    ? requests
    : requests.filter((r) => r.status === filter);

  const openCount = requests.filter((r) => r.status === 'open').length;

  const handleReply = async (requestId: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await respondToAdminRequest(requestId, replyText.trim());
      setReplyingTo(null);
      setReplyText('');
    } catch (err) {
      console.error('Failed to respond:', err);
    }
    setSubmitting(false);
  };

  const statusStyle = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'responded': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'closed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-white/10 text-white/50 border-white/20';
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'equipment': return '🔧';
      case 'general': return '💬';
      default: return '📋';
    }
  };

  if (!buildingId || !buildingName) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <h2 className="text-2xl font-bold text-white mb-4">Inbox</h2>
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white/60 mb-2">No Building Assigned</h3>
          <p className="text-sm text-white/30 max-w-sm mx-auto">
            You need to be assigned to a building to view inbox messages.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            Inbox
            {openCount > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {openCount} new
              </span>
            )}
          </h2>
          <p className="text-white/40 mt-1">
            Messages from users in <span className="text-teal-400 font-bold">{buildingName}</span>
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {(['all', 'open', 'responded', 'closed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all whitespace-nowrap ${
              filter === f
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-white/5 text-white/40 border border-white/10 hover:text-white/60'
            }`}
          >
            {f === 'all' ? `All (${requests.length})` : `${f} (${requests.filter(r => r.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="glass-card p-12 !rounded-xl text-center">
            <svg className="w-14 h-14 text-white/8 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm text-white/30 font-bold">No messages</p>
            <p className="text-xs text-white/15 mt-1">
              {filter === 'all' ? 'Your inbox is empty' : `No ${filter} messages`}
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div key={req.id} className="glass-card p-5 !rounded-xl">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {req.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-bold text-white">{req.userName}</h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle(req.status)} capitalize`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/40">
                      <span className="mr-1">{typeIcon(req.type)}</span>
                      {req.type} · {req.subject}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message */}
              <p className="text-sm text-white/50 mb-3">{req.message}</p>

              {/* Admin Response */}
              {req.adminResponse && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-3">
                  <p className="text-xs font-bold text-primary mb-1">Your Response</p>
                  <p className="text-sm text-white/60">{req.adminResponse}</p>
                </div>
              )}

              {/* Reply Section */}
              {req.status === 'open' && (
                <>
                  {replyingTo === req.id ? (
                    <div className="space-y-3 mt-3 pt-3 border-t border-white/5">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="glass-input w-full px-4 py-3 min-h-[100px] resize-none"
                        placeholder="Type your response..."
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReply(req.id)}
                          disabled={submitting || !replyText.trim()}
                          className="btn-primary px-5 py-2 text-sm flex items-center gap-2"
                        >
                          {submitting ? (
                            <>
                              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Sending...
                            </>
                          ) : (
                            'Send Response'
                          )}
                        </button>
                        <button
                          onClick={() => { setReplyingTo(null); setReplyText(''); }}
                          className="px-4 py-2 text-sm font-bold text-white/40 hover:text-white/60 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(req.id)}
                      className="mt-2 px-4 py-2 rounded-xl text-sm font-bold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Reply
                    </button>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
