'use client';

import React, { useState } from 'react';

// ─── Mock Data ──────────────────────────────────────────────────
const assignedRooms = [
  { id: 1, name: 'Room 101', floor: '1st Floor', status: 'Locked', lastOpened: '08:30 AM' },
  { id: 2, name: 'Room 102', floor: '1st Floor', status: 'Unlocked', lastOpened: '09:15 AM' },
  { id: 3, name: 'Room 201', floor: '2nd Floor', status: 'Locked', lastOpened: '07:45 AM' },
  { id: 4, name: 'Room 202', floor: '2nd Floor', status: 'Unlocked', lastOpened: '10:00 AM' },
  { id: 5, name: 'Room 301', floor: '3rd Floor', status: 'Locked', lastOpened: 'Yesterday' },
  { id: 6, name: 'Room 302', floor: '3rd Floor', status: 'Locked', lastOpened: 'Yesterday' },
];

const pendingRequests = [
  { id: 1, requestedBy: 'Prof. Maria Santos', room: 'Room 101', type: 'Open Room', time: '10:30 AM', urgency: 'Normal' },
  { id: 2, requestedBy: 'Prof. Juan Dela Cruz', room: 'Room 301', type: 'Equipment Setup', time: '11:00 AM', urgency: 'Urgent' },
  { id: 3, requestedBy: 'Admin Office', room: 'Room 202', type: 'Maintenance', time: '01:00 PM', urgency: 'Normal' },
];

const recentActivity = [
  { id: 1, action: 'Opened Room 101', time: '08:30 AM', status: 'Completed' },
  { id: 2, action: 'Locked Room 201', time: '09:00 AM', status: 'Completed' },
  { id: 3, action: 'Opened Room 102', time: '09:15 AM', status: 'Completed' },
  { id: 4, action: 'Opened Room 202', time: '10:00 AM', status: 'Completed' },
];

// ─── Helpers ────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const style = (() => {
    switch (status) {
      case 'Unlocked': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Locked': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-white/10 text-white/50 border-white/20';
    }
  })();
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${style}`}>
      {status}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const style = urgency === 'Urgent'
    ? 'bg-red-500/20 text-red-300 border-red-500/30'
    : 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${style}`}>
      {urgency}
    </span>
  );
}

// ─── Component ──────────────────────────────────────────────────
interface UtilityStaffDashboardProps {
  firstName: string;
}

export default function UtilityStaffDashboard({ firstName }: UtilityStaffDashboardProps) {
  const [requests, setRequests] = useState(pendingRequests);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const handleComplete = (id: number) => {
    setActionLoading(id);
    setTimeout(() => {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setActionLoading(null);
    }, 500);
  };

  const unlockedCount = assignedRooms.filter(r => r.status === 'Unlocked').length;
  const lockedCount = assignedRooms.filter(r => r.status === 'Locked').length;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
      {/* Welcome */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Hello, {firstName} 🔑</h2>
        <p className="text-white/40 mt-1">Manage rooms and assist with facility needs</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-5 border-l-4 border-teal-500/60">
          <p className="text-2xl font-bold text-teal-400">{assignedRooms.length}</p>
          <p className="text-xs text-white/50 font-bold">Assigned Rooms</p>
        </div>
        <div className="glass-card p-5 border-l-4 border-green-500/60">
          <p className="text-2xl font-bold text-green-400">{unlockedCount}</p>
          <p className="text-xs text-white/50 font-bold">Unlocked</p>
        </div>
        <div className="glass-card p-5 border-l-4 border-red-500/60">
          <p className="text-2xl font-bold text-red-400">{lockedCount}</p>
          <p className="text-xs text-white/50 font-bold">Locked</p>
        </div>
        <div className="glass-card p-5 border-l-4 border-yellow-500/60">
          <p className="text-2xl font-bold text-yellow-400">{requests.length}</p>
          <p className="text-xs text-white/50 font-bold">Pending Requests</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ─── Main Content (left) ─────────────────────────────── */}
        <div className="flex-1 space-y-8">
          {/* Pending Room Requests */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Pending Requests</h3>
              {requests.length > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                  {requests.length} pending
                </span>
              )}
            </div>

            {requests.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <div className="text-4xl mb-3">✅</div>
                <h4 className="text-lg font-bold text-white/60 mb-1">All caught up!</h4>
                <p className="text-sm text-white/30">No room requests waiting.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div key={req.id} className="glass-card p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm">{req.type}</h4>
                            <UrgencyBadge urgency={req.urgency} />
                          </div>
                          <p className="text-xs text-white/40 mt-0.5">
                            {req.room} · {req.time}
                          </p>
                          <p className="text-xs text-white/30 mt-0.5">Requested by: {req.requestedBy}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleComplete(req.id)}
                        disabled={actionLoading === req.id}
                        className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 transition-all disabled:opacity-50 shrink-0"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Mark Done
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Room Status Grid */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Assigned Rooms</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedRooms.map((room) => {
                const borderColor = room.status === 'Unlocked'
                  ? 'border-green-500/40'
                  : 'border-red-500/40';

                return (
                  <div key={room.id} className={`glass-card p-5 border-l-4 ${borderColor}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-white">{room.name}</h4>
                        <p className="text-sm text-white/40">{room.floor}</p>
                      </div>
                      <StatusBadge status={room.status} />
                    </div>
                    <p className="text-xs text-white/30 mb-3">Last opened: {room.lastOpened}</p>
                    <button
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        room.status === 'Locked'
                          ? 'border-green-500/30 text-green-300 hover:bg-green-500/20'
                          : 'border-red-500/30 text-red-300 hover:bg-red-500/20'
                      }`}
                    >
                      {room.status === 'Locked' ? '🔓 Unlock Room' : '🔒 Lock Room'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Sidebar (right) ─────────────────────────────────── */}
        <div className="lg:w-80 shrink-0 space-y-4">
          {/* Recent Activity */}
          <div className="glass-card p-4 !rounded-xl">
            <h4 className="text-sm font-bold text-white/70 mb-3">Recent Activity</h4>
            <div className="space-y-2.5">
              {recentActivity.map((act) => (
                <div key={act.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/3 hover:bg-white/5 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{act.action}</p>
                    <p className="text-[10px] text-white/40">{act.time}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                    {act.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass-card p-4 !rounded-xl">
            <h4 className="text-sm font-bold text-white/70 mb-3">Today&apos;s Summary</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-lg bg-white/3">
                <p className="text-xl font-bold text-white">{assignedRooms.length}</p>
                <p className="text-[10px] text-white/40 font-bold">Total Rooms</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/3">
                <p className="text-xl font-bold text-green-400">{unlockedCount}</p>
                <p className="text-[10px] text-white/40 font-bold">Open</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/3">
                <p className="text-xl font-bold text-yellow-400">{requests.length}</p>
                <p className="text-[10px] text-white/40 font-bold">Requests</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/3">
                <p className="text-xl font-bold text-blue-400">{recentActivity.length}</p>
                <p className="text-[10px] text-white/40 font-bold">Actions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
