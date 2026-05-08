'use client';

import { useMemo, useState } from 'react';
import MessagesSection from '@/components/messages/MessagesSection';
import {
  respondToAdminRequest,
  type AdminRequest,
} from '@/lib/admin/adminRequests';
import { formatDateTime } from '@/lib/utils/dateTime';

interface AdminInboxTabProps {
  adminRequests: AdminRequest[];
  buildingName: string;
  onReload: () => Promise<void>;
}

export default function AdminInboxTab({
  adminRequests,
  buildingName,
  onReload,
}: AdminInboxTabProps) {
  const [inboxFilter, setInboxFilter] = useState<'all' | 'open' | 'responded' | 'closed'>('all');
  const [inboxReplyingTo, setInboxReplyingTo] = useState<string | null>(null);
  const [inboxReplyText, setInboxReplyText] = useState('');
  const [inboxSubmitting, setInboxSubmitting] = useState(false);
  const [inboxExpandedId, setInboxExpandedId] = useState<string | null>(null);

  const filteredInbox = useMemo(
    () =>
      inboxFilter === 'all'
        ? adminRequests
        : adminRequests.filter((request) => request.status === inboxFilter),
    [adminRequests, inboxFilter]
  );
  const openCount = adminRequests.filter((request) => request.status === 'open').length;

  const handleInboxReply = async (requestId: string) => {
    if (!inboxReplyText.trim()) {
      return;
    }

    setInboxSubmitting(true);
    try {
      await respondToAdminRequest(requestId, inboxReplyText.trim());
      setInboxReplyingTo(null);
      setInboxReplyText('');
      await onReload();
    } catch (error) {
      console.error('Failed to respond:', error);
    } finally {
      setInboxSubmitting(false);
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'equipment':
        return 'Tool';
      case 'general':
        return 'Chat';
      default:
        return 'Request';
    }
  };

  return (
    <div>
      <MessagesSection
        title="Staff Messages"
        subtitle="Direct conversations with utility staff and faculty."
      />

      <div className="flex items-center justify-between mb-6 bg-white rounded-xl px-6 py-4 border border-white/30">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
            User Requests
            {openCount > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ui-badge-blue">
                {openCount} new
              </span>
            )}
          </h3>
          <p className="text-gray-600 mt-1 text-sm">
            Support requests from users in{' '}
            <span className="ui-text-teal font-bold">{buildingName}</span>
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {(['all', 'open', 'responded', 'closed'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setInboxFilter(filter)}
            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all whitespace-nowrap ${
              inboxFilter === filter
                ? 'bg-primary text-white border border-primary'
                : 'bg-white text-gray-700 border border-gray-200 hover:text-primary'
            }`}
          >
            {filter === 'all'
              ? `All (${adminRequests.length})`
              : `${filter} (${adminRequests.filter((request) => request.status === filter).length})`}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredInbox.length === 0 ? (
          <div className="glass-card p-12 !rounded-xl text-center">
            <svg className="w-14 h-14 text-black mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm text-black font-bold">No messages</p>
            <p className="text-xs text-black mt-1">
              {inboxFilter === 'all' ? 'Your inbox is empty' : `No ${inboxFilter} messages`}
            </p>
          </div>
        ) : (
          filteredInbox.map((request) => {
            const isExpanded = inboxExpandedId === request.id;

            return (
              <div key={request.id} className="glass-card !rounded-xl overflow-hidden">
                <button
                  onClick={() => setInboxExpandedId(isExpanded ? null : request.id)}
                  className="w-full p-5 text-left hover:bg-primary/10 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-dark/5 border border-dark/10 flex items-center justify-center text-black font-bold text-sm shrink-0">
                        {request.userName
                          .split(' ')
                          .map((name) => name[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-sm font-bold text-black">{request.userName}</h4>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              request.status === 'open'
                                ? 'ui-badge-blue'
                                : request.status === 'responded'
                                  ? 'ui-badge-green'
                                  : 'ui-badge-gray'
                            } capitalize`}
                          >
                            {request.status}
                          </span>
                        </div>
                        <p className="text-xs text-black">
                          <span className="mr-1">{typeIcon(request.type)}</span>
                          {request.type} · {request.subject}
                          {request.createdAt && (
                            <span className="ml-2 text-black">
                              | {formatDateTime(request.createdAt)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <svg className={`w-5 h-5 text-black transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-dark/5 px-5 pb-5">
                    <div className="mt-4">
                      <p className="text-xs font-bold text-black mb-2">Message</p>
                      <p className="text-sm text-black leading-relaxed bg-dark/3 border border-dark/5 rounded-xl p-3">
                        {request.message}
                      </p>
                    </div>

                    {request.adminResponse && (
                      <div className="mt-4">
                        <p className="text-xs font-bold ui-text-green mb-2">Your Response</p>
                        <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-3">
                          <p className="text-sm text-black leading-relaxed">
                            {request.adminResponse}
                          </p>
                        </div>
                      </div>
                    )}

                    {request.status === 'open' &&
                      (inboxReplyingTo === request.id ? (
                        <div className="space-y-3 mt-4 pt-4 border-t border-dark/5">
                          <textarea
                            value={inboxReplyText}
                            onChange={(event) => setInboxReplyText(event.target.value)}
                            className="glass-input w-full px-4 py-3 min-h-[100px] resize-none"
                            placeholder="Type your response..."
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleInboxReply(request.id)}
                              disabled={inboxSubmitting || !inboxReplyText.trim()}
                              className="btn-primary px-5 py-2 text-sm flex items-center gap-2"
                            >
                              {inboxSubmitting ? 'Sending...' : 'Send Response'}
                            </button>
                            <button
                              onClick={() => {
                                setInboxReplyingTo(null);
                                setInboxReplyText('');
                              }}
                              className="px-4 py-2 text-sm font-bold text-black hover:text-primary transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setInboxReplyingTo(request.id)}
                          className="mt-4 px-4 py-2 rounded-xl text-sm font-bold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all flex items-center gap-2"
                        >
                          Reply
                        </button>
                      ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
