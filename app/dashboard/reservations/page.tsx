'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  onReservationsByUser,
  cancelReservation,
  completeReservation,
  deleteReservation,
  Reservation,
} from '@/lib/reservations';

// ─── Status Badge ───────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const style = (() => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'completed': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'pending': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cancelled': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-white/10 text-white/50 border-white/20';
    }
  })();
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${style} capitalize`}>
      {status}
    </span>
  );
}

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export default function MyReservationsPage() {
  const { firebaseUser } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsub = onReservationsByUser(firebaseUser.uid, setReservations);
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser?.uid]);

  const filtered = activeFilter === 'all'
    ? reservations
    : reservations.filter((r) => r.status === activeFilter);

  const filters: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: reservations.length },
    { key: 'pending', label: 'Pending', count: reservations.filter((r) => r.status === 'pending').length },
    { key: 'approved', label: 'Approved', count: reservations.filter((r) => r.status === 'approved').length },
    { key: 'rejected', label: 'Rejected', count: reservations.filter((r) => r.status === 'rejected').length },
    { key: 'completed', label: 'Completed', count: reservations.filter((r) => r.status === 'completed').length },
    { key: 'cancelled', label: 'Cancelled', count: reservations.filter((r) => r.status === 'cancelled').length },
  ];

  const handleCancel = async (id: string) => {
    if (!firebaseUser) return;
    setActionLoading(id);
    try {
      await cancelReservation(id, firebaseUser.uid);
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
    setActionLoading(null);
  };

  const handleComplete = async (id: string) => {
    if (!firebaseUser) return;
    setActionLoading(id);
    try {
      await completeReservation(id, firebaseUser.uid);
    } catch (err) {
      console.error('Failed to complete:', err);
    }
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    if (!firebaseUser) return;
    if (!confirm('Are you sure you want to delete this reservation? This cannot be undone.')) return;
    setActionLoading(id);
    try {
      await deleteReservation(id, firebaseUser.uid);
    } catch (err) {
      console.warn('Failed to delete:', err);
    }
    setActionLoading(null);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 pb-24 md:pb-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">My Reservations</h2>
        <p className="text-white/40 mt-1">View and manage all your room reservations</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeFilter === f.key
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-white/5 text-white/40 border border-white/10 hover:text-white/60 hover:bg-white/10'
            }`}
          >
            {f.label}
            {f.count > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
                activeFilter === f.key ? 'bg-primary/30 text-primary' : 'bg-white/10 text-white/30'
              }`}>
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reservation List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="glass-card p-12 !rounded-xl text-center">
            <svg className="w-14 h-14 text-white/8 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-sm text-white/30 font-bold">No {activeFilter === 'all' ? '' : activeFilter} reservations</p>
          </div>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="glass-card p-5 !rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-bold text-white">{r.roomName}</h3>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-sm text-white/40">{r.buildingName}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-white/40">{r.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-white/40">{r.startTime} – {r.endTime}</span>
                    </div>
                  </div>
                  <p className="text-xs text-white/25 mt-1.5">{r.purpose}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  {(r.status === 'pending' || r.status === 'approved') && (
                    <button
                      onClick={() => handleCancel(r.id)}
                      disabled={actionLoading === r.id}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                    >
                      {actionLoading === r.id ? 'Processing...' : 'Cancel'}
                    </button>
                  )}
                  {r.status === 'approved' && (
                    <button
                      onClick={() => handleComplete(r.id)}
                      disabled={actionLoading === r.id}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all disabled:opacity-50"
                    >
                      {actionLoading === r.id ? 'Processing...' : 'Mark Complete'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={actionLoading === r.id}
                    className="p-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 border border-white/10 transition-all disabled:opacity-50"
                    title="Delete reservation"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
