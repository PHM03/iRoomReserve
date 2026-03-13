'use client';

import React from 'react';

// ─── Mock Data ──────────────────────────────────────────────────
const stats = [
  { icon: '📋', label: 'Total Reservations', count: 12, color: 'border-blue-500/60', textColor: 'text-blue-400' },
  { icon: '⏳', label: 'Pending', count: 3, color: 'border-yellow-500/60', textColor: 'text-yellow-400' },
  { icon: '✅', label: 'Approved', count: 7, color: 'border-green-500/60', textColor: 'text-green-400' },
  { icon: '❌', label: 'Rejected', count: 2, color: 'border-red-500/60', textColor: 'text-red-400' },
];

const upcomingReservations = [
  { id: 1, room: 'Room 101', date: 'Mar 14, 2026', time: '09:00 – 10:30', purpose: 'Lecture', status: 'Approved' },
  { id: 2, room: 'Room 201', date: 'Mar 14, 2026', time: '13:00 – 14:30', purpose: 'Group Study', status: 'Pending' },
  { id: 3, room: 'Room 302', date: 'Mar 15, 2026', time: '10:00 – 12:00', purpose: 'Workshop', status: 'Approved' },
  { id: 4, room: 'Room 102', date: 'Mar 16, 2026', time: '16:00 – 17:00', purpose: 'Tutorial', status: 'Rejected' },
];

const recentActivity = [
  { id: 1, text: 'Room 101 reservation approved', time: '2 hours ago', icon: '✅' },
  { id: 2, text: 'Submitted reservation for Room 302', time: '5 hours ago', icon: '📤' },
  { id: 3, text: 'Room 201 reservation pending review', time: '1 day ago', icon: '⏳' },
  { id: 4, text: 'Room 102 reservation was rejected', time: '2 days ago', icon: '❌' },
  { id: 5, text: 'Checked in to Room 101', time: '3 days ago', icon: '📍' },
];

// ─── Status Badge ───────────────────────────────────────────────
function ReservationBadge({ status }: { status: string }) {
  const style = (() => {
    switch (status) {
      case 'Approved': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Rejected': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-white/10 text-white/50 border-white/20';
    }
  })();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${style}`}>
      {status}
    </span>
  );
}

// ─── Component ──────────────────────────────────────────────────
interface StudentDashboardProps {
  firstName: string;
}

export default function StudentDashboard({ firstName }: StudentDashboardProps) {
  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 pb-24 md:pb-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Welcome back, {firstName} 🎓</h2>
          <p className="text-white/40 mt-1">Here&apos;s an overview of your reservations</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className={`glass-card p-5 border-l-4 ${s.color}`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl">
                  {s.icon}
                </div>
                <div>
                  <p className={`text-2xl font-bold ${s.textColor}`}>{s.count}</p>
                  <p className="text-xs text-white/50 font-bold">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Reservations */}
        <div className="mb-10">
          <h3 className="text-xl font-bold text-white mb-4">Upcoming Reservations</h3>

          {/* Desktop Table */}
          <div className="hidden md:block glass-card overflow-hidden !rounded-xl">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingReservations.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">{r.room}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">{r.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">{r.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">{r.purpose}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><ReservationBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {upcomingReservations.map((r) => (
              <div key={r.id} className="glass-card p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-white">{r.room}</h4>
                    <p className="text-sm text-white/40">{r.date}</p>
                  </div>
                  <ReservationBadge status={r.status} />
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/40">Time:</span>
                    <span className="font-bold text-white/70">{r.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Purpose:</span>
                    <span className="font-bold text-white/70">{r.purpose}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
          <div className="glass-card p-5 !rounded-xl">
            <div className="space-y-0">
              {recentActivity.map((a, idx) => (
                <div key={a.id} className="flex items-start gap-4">
                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm shrink-0">
                      {a.icon}
                    </div>
                    {idx < recentActivity.length - 1 && (
                      <div className="w-px h-8 bg-white/10" />
                    )}
                  </div>
                  <div className="pt-1 pb-4">
                    <p className="text-sm text-white/80 font-bold">{a.text}</p>
                    <p className="text-xs text-white/30 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
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
