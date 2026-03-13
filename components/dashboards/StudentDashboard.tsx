'use client';

import React from 'react';

// ─── Status Badge ───────────────────────────────────────────────
function HistoryBadge({ status }: { status: string }) {
  const style = (() => {
    switch (status) {
      case 'Approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Completed': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Pending': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-white/10 text-white/50 border-white/20';
    }
  })();
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${style}`}>
      {status}
    </span>
  );
}

function HistoryDot({ status }: { status: string }) {
  const color = (() => {
    switch (status) {
      case 'Approved': return 'bg-green-400';
      case 'Rejected': return 'bg-red-400';
      case 'Completed': return 'bg-yellow-400';
      case 'Pending': return 'bg-blue-400';
      default: return 'bg-white/30';
    }
  })();
  return <span className={`w-2.5 h-full min-h-full rounded-full ${color} shrink-0`} />;
}

// ─── Component ──────────────────────────────────────────────────
interface StudentDashboardProps {
  firstName: string;
}

// Empty state — no mock data. These arrays will be populated from Firestore later.
const activeReservation: { room: string; status: string; until: string } | null = null;
const pendingCount = 0;
const nextBooking: { time: string; room: string; inMinutes: string } | null = null;
const reservationHistory: { id: number; room: string; type: string; time: string; status: string }[] = [];

export default function StudentDashboard({ firstName }: StudentDashboardProps) {
  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 pb-24 md:pb-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Welcome back, {firstName} 🎓</h2>
          <p className="text-white/40 mt-1">Here&apos;s an overview of your reservations</p>
        </div>

        {/* ─── Top 3 Cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Active Now */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-xs text-white/40 font-bold">Active Now</span>
            </div>
            {activeReservation ? (
              <>
                <h3 className="text-lg font-bold text-white">{activeReservation.room}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-400 font-bold">Currently Occupied</span>
                </div>
                <p className="text-[10px] text-white/30 mt-0.5">Until {activeReservation.until}</p>
                <button className="mt-3 w-full py-2 px-3 rounded-xl text-xs font-bold border border-white/15 text-white/60 hover:bg-white/5 hover:text-white transition-all">
                  Finish Reservation
                </button>
              </>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm text-white/30 font-bold">No active room</p>
                <p className="text-[10px] text-white/20 mt-0.5">You have no reservation right now</p>
              </div>
            )}
          </div>

          {/* Pending Requests */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-xs text-white/40 font-bold">Pending Requests</span>
            </div>
            <h3 className="text-3xl font-bold text-white">{pendingCount}</h3>
            <p className="text-xs text-white/30 mt-0.5">Requests</p>
            <button className="mt-3 w-full py-2 px-3 rounded-xl text-xs font-bold border border-white/15 text-white/60 hover:bg-white/5 hover:text-white transition-all">
              See Pending Requests
            </button>
          </div>

          {/* Next Booking */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs text-white/40 font-bold">Next Booking</span>
            </div>
            {nextBooking ? (
              <>
                <h3 className="text-2xl font-bold text-white">{nextBooking.time}</h3>
                <p className="text-xs text-white/40 mt-0.5">{nextBooking.room}</p>
                <p className="text-[10px] text-white/20">In {nextBooking.inMinutes}</p>
              </>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm text-white/30 font-bold">No upcoming</p>
                <p className="text-[10px] text-white/20 mt-0.5">No reservations scheduled</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── New Reservation Button ─────────────────────────────── */}
        <button className="w-full glass-card p-5 !rounded-2xl flex items-center justify-center gap-3 mb-8 group hover:!border-primary/40 transition-all cursor-pointer">
          <svg className="w-6 h-6 text-white/40 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-lg font-bold text-white/60 group-hover:text-white transition-colors">
            New Reservation
          </span>
        </button>

        {/* ─── Reservation History ─────────────────────────────────── */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Reservation History</h3>
          <div className="glass-card !rounded-xl overflow-hidden">
            {reservationHistory.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-14 h-14 text-white/8 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-sm text-white/30 font-bold">No reservations yet</p>
                <p className="text-xs text-white/15 mt-1">Your reservation history will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {reservationHistory.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                    {/* Color Bar */}
                    <HistoryDot status={item.status} />
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white">{item.room} · {item.type}</h4>
                      <p className="text-xs text-white/35 mt-0.5">{item.time}</p>
                    </div>
                    {/* Status Badge */}
                    <HistoryBadge status={item.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 glass-nav border-t border-white/10 z-40">
        <div className="grid grid-cols-4 h-16">
          {[
            { label: 'Home', active: true, icon: <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /> },
            { label: 'Reservations', active: false, icon: <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /> },
            { label: 'Reserve', active: false, icon: <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /> },
            { label: 'Alerts', active: false, icon: <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /> },
          ].map((item) => (
            <button key={item.label} className={`flex flex-col items-center justify-center transition-colors ${item.active ? 'text-primary' : 'text-white/30 hover:text-primary'}`}>
              <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 20 20">{item.icon}</svg>
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
