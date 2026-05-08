'use client';

import { useState } from 'react';
import {
  approveReservation,
  rejectReservation,
  type Reservation,
} from '@/lib/reservations/reservations';
import { formatTimeRange } from '@/lib/utils/dateTime';
import { formatReservationDates, RoleBadge } from './shared';

interface AdminPendingTabProps {
  approverEmail?: string | null;
  buildingName: string;
  requests: Reservation[];
  onReload: () => Promise<void>;
}

export default function AdminPendingTab({
  approverEmail,
  buildingName,
  requests,
  onReload,
}: AdminPendingTabProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingReservationId, setRejectingReservationId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reservationActionError, setReservationActionError] = useState('');

  const handleApprove = async (id: string) => {
    if (!approverEmail) {
      return;
    }

    setReservationActionError('');
    setActionLoading(id);

    try {
      await approveReservation(id, approverEmail);
      await onReload();
    } catch (error) {
      console.warn('Failed to approve:', error);
      setReservationActionError(
        error instanceof Error ? error.message : 'Failed to approve reservation.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!approverEmail) {
      return;
    }

    if (!rejectReason.trim()) {
      setReservationActionError('Please enter a reason before rejecting this reservation.');
      return;
    }

    setReservationActionError('');
    setActionLoading(id);

    try {
      await rejectReservation(id, approverEmail, rejectReason.trim());
      setRejectingReservationId(null);
      setRejectReason('');
      await onReload();
    } catch (error) {
      console.warn('Failed to reject:', error);
      setReservationActionError(
        error instanceof Error ? error.message : 'Failed to reject reservation.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 bg-white rounded-xl px-6 py-4 border border-white/30">
        <div>
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
            Pending Reservations
            {requests.length > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ui-badge-yellow">
                {requests.length} pending
              </span>
            )}
          </h3>
          <p className="text-gray-600 mt-1 text-sm">
            Review and approve reservation requests for{' '}
            <span className="ui-text-teal font-bold">{buildingName}</span>
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="glass-card p-12 !rounded-xl text-center">
          <svg className="w-16 h-16 text-black mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-sm text-black font-bold">All caught up!</p>
          <p className="text-xs text-black mt-1">No pending reservation requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservationActionError && (
            <p className="text-xs ui-text-red font-bold">{reservationActionError}</p>
          )}
          {requests.map((request) => (
            <div
              key={request.id}
              className="glass-card !rounded-xl overflow-hidden border-l-4 border-yellow-500/40"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center ui-text-yellow font-bold text-sm shrink-0">
                      {request.userName
                        .split(' ')
                        .map((name) => name[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-bold text-black">{request.userName}</h4>
                        <RoleBadge role={request.userRole} />
                      </div>
                      <p className="text-xs text-black">Reservation Request</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ui-badge-yellow">
                    Pending
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className="bg-dark/3 rounded-xl p-3 border border-dark/5">
                    <p className="text-[10px] text-black font-bold uppercase tracking-wider mb-1">
                      Room
                    </p>
                    <p className="text-sm font-bold text-black">{request.roomName}</p>
                    <p className="text-xs text-black mt-0.5">{request.buildingName}</p>
                  </div>
                  <div className="bg-dark/3 rounded-xl p-3 border border-dark/5">
                    <p className="text-[10px] text-black font-bold uppercase tracking-wider mb-1">
                      Date
                    </p>
                    <p className="text-sm font-bold text-black">
                      {formatReservationDates(request.dates, request.date)}
                    </p>
                  </div>
                  <div className="bg-dark/3 rounded-xl p-3 border border-dark/5">
                    <p className="text-[10px] text-black font-bold uppercase tracking-wider mb-1">
                      Time
                    </p>
                    <p className="text-sm font-bold text-black">
                      {formatTimeRange(request.startTime, request.endTime)}
                    </p>
                  </div>
                  <div className="bg-dark/3 rounded-xl p-3 border border-dark/5">
                    <p className="text-[10px] text-black font-bold uppercase tracking-wider mb-1">
                      Purpose
                    </p>
                    <p className="text-sm font-bold text-black truncate">
                      {request.purpose || 'Not specified'}
                    </p>
                  </div>
                </div>

                {request.equipment && Object.keys(request.equipment).length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="bg-dark/3 rounded-xl p-3 border border-dark/5">
                      <p className="text-[10px] text-black font-bold uppercase tracking-wider mb-1">
                        Equipment
                      </p>
                      <p className="text-sm text-black">
                        {Object.entries(request.equipment)
                          .map(([key, value]) => `${key} (x${value})`)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {request.approvalDocumentUrl && (
                  <div className="mb-4">
                    <div className="bg-dark/3 rounded-xl p-3 border border-dark/5">
                      <p className="text-[10px] text-black font-bold uppercase tracking-wider mb-1">
                        Concept Paper / Letter of Approval
                      </p>
                      <a
                        href={request.approvalDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-bold text-primary hover:text-primary-hover transition-colors"
                      >
                        {request.approvalDocumentName || 'Open attachment'}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4 border-t border-dark/5">
                  <button
                    onClick={() => handleApprove(request.id)}
                    disabled={actionLoading === request.id}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold ui-button-green disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setReservationActionError('');
                      setRejectingReservationId(
                        rejectingReservationId === request.id ? null : request.id
                      );
                      setRejectReason('');
                    }}
                    disabled={actionLoading === request.id}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold ui-button-red disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </button>
                </div>

                {rejectingReservationId === request.id && (
                  <div className="mt-4 space-y-3 pt-4 border-t border-dark/5">
                    <label className="block text-xs font-bold text-black">
                      Reason for rejection
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(event) => setRejectReason(event.target.value)}
                      className="glass-input w-full px-4 py-3 min-h-[110px] resize-none"
                      placeholder="Explain why this reservation request is being rejected."
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={actionLoading === request.id || !rejectReason.trim()}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-bold ui-button-red disabled:opacity-50"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        onClick={() => {
                          setRejectingReservationId(null);
                          setRejectReason('');
                        }}
                        className="px-4 py-2 text-sm font-bold text-black hover:text-primary transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
