'use client';

import React, { useState } from 'react';

// ─── Mock Data ──────────────────────────────────────────────────
const pendingReservations = [
  { id: 1, name: 'Juan Dela Cruz', role: 'Student', room: 'Room 101', date: 'Mar 14, 2026', time: '09:00 – 10:30', purpose: 'Group Study' },
  { id: 2, name: 'Maria Santos', role: 'Faculty', room: 'Room 201', date: 'Mar 14, 2026', time: '13:00 – 14:30', purpose: 'Lecture' },
  { id: 3, name: 'Jose Rizal', role: 'Student', room: 'Room 302', date: 'Mar 15, 2026', time: '10:00 – 12:00', purpose: 'Workshop' },
  { id: 4, name: 'Ana Reyes', role: 'Faculty', room: 'Room 102', date: 'Mar 16, 2026', time: '16:00 – 17:00', purpose: 'Meeting' },
];

const rooms = [
  { id: 1, name: 'Room 101', floor: '1st Floor', status: 'Occupied', reservedBy: 'Juan Dela Cruz' },
  { id: 2, name: 'Room 102', floor: '1st Floor', status: 'Available', reservedBy: null },
  { id: 3, name: 'Room 201', floor: '2nd Floor', status: 'Occupied', reservedBy: 'Maria Santos' },
  { id: 4, name: 'Room 202', floor: '2nd Floor', status: 'Available', reservedBy: null },
  { id: 5, name: 'Room 301', floor: '3rd Floor', status: 'Reserved', reservedBy: 'Jose Rizal' },
  { id: 6, name: 'Room 302', floor: '3rd Floor', status: 'Occupied', reservedBy: 'Ana Reyes' },
];

const bleBeacons = [
  { id: 1, room: 'Room 101', signal: 'Online', rssi: -42, battery: 92 },
  { id: 2, room: 'Room 102', signal: 'Weak', rssi: -78, battery: 45 },
  { id: 3, room: 'Room 201', signal: 'Online', rssi: -38, battery: 88 },
  { id: 4, room: 'Room 202', signal: 'Offline', rssi: null, battery: 12 },
  { id: 5, room: 'Room 301', signal: 'Online', rssi: -45, battery: 76 },
  { id: 6, room: 'Room 302', signal: 'Weak', rssi: -82, battery: 31 },
];

// ─── Helpers ────────────────────────────────────────────────────
function SignalBadge({ signal }: { signal: string }) {
  const style = (() => {
    switch (signal) {
      case 'Online': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Weak': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Offline': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-white/10 text-white/50 border-white/20';
    }
  })();
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${style}`}>
      {signal}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const style = role === 'Faculty'
    ? 'bg-green-500/20 text-green-300 border-green-500/30'
    : 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${style}`}>
      {role}
    </span>
  );
}

// ─── Component ──────────────────────────────────────────────────
interface AdminDashboardProps {
  firstName: string;
}

export default function AdminDashboard({ firstName }: AdminDashboardProps) {
  const [requests, setRequests] = useState(pendingReservations);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const handleApprove = (id: number) => {
    setActionLoading(id);
    setTimeout(() => {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setActionLoading(null);
    }, 500);
  };

  const handleReject = (id: number) => {
    setActionLoading(id);
    setTimeout(() => {
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setActionLoading(null);
    }, 500);
  };

  const onlineBeacons = bleBeacons.filter(b => b.signal === 'Online').length;
  const weakBeacons = bleBeacons.filter(b => b.signal === 'Weak').length;
  const offlineBeacons = bleBeacons.filter(b => b.signal === 'Offline').length;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
      {/* Welcome */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Welcome, {firstName} 🏛️</h2>
        <p className="text-white/40 mt-1">Manage reservations, rooms, and BLE beacons</p>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-5 border-l-4 border-yellow-500/60">
          <p className="text-2xl font-bold text-yellow-400">{requests.length}</p>
          <p className="text-xs text-white/50 font-bold">Pending Requests</p>
        </div>
        <div className="glass-card p-5 border-l-4 border-green-500/60">
          <p className="text-2xl font-bold text-green-400">{rooms.filter(r => r.status === 'Available').length}</p>
          <p className="text-xs text-white/50 font-bold">Available Rooms</p>
        </div>
        <div className="glass-card p-5 border-l-4 border-orange-500/60">
          <p className="text-2xl font-bold text-orange-400">{rooms.filter(r => r.status === 'Occupied').length}</p>
          <p className="text-xs text-white/50 font-bold">Occupied Rooms</p>
        </div>
        <div className="glass-card p-5 border-l-4 border-blue-500/60">
          <p className="text-2xl font-bold text-blue-400">{onlineBeacons}</p>
          <p className="text-xs text-white/50 font-bold">Beacons Online</p>
        </div>
      </div>

      {/* ─── Pending Reservation Requests ────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Pending Reservation Requests</h3>
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
            <p className="text-sm text-white/30">No reservation requests waiting for approval.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="glass-card p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* User + Details */}
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {req.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{req.name}</h4>
                        <RoleBadge role={req.role} />
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">
                        {req.room} · {req.date} · {req.time}
                      </p>
                      <p className="text-xs text-white/30 mt-0.5">Purpose: {req.purpose}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(req.id)}
                      disabled={actionLoading === req.id}
                      className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-all disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      disabled={actionLoading === req.id}
                      className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Live Room Status Grid ───────────────────────────────── */}
      <div className="mb-10">
        <h3 className="text-xl font-bold text-white mb-4">Live Room Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => {
            const statusBorder = room.status === 'Occupied'
              ? 'border-orange-500/40'
              : room.status === 'Reserved'
                ? 'border-blue-500/40'
                : 'border-green-500/40';
            const statusBadge = room.status === 'Occupied'
              ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
              : room.status === 'Reserved'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                : 'bg-green-500/20 text-green-300 border-green-500/30';

            return (
              <div key={room.id} className={`glass-card p-5 border-l-4 ${statusBorder}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-lg font-bold text-white">{room.name}</h4>
                    <p className="text-sm text-white/40">{room.floor}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge}`}>
                    {room.status}
                  </span>
                </div>
                {room.reservedBy && (
                  <p className="text-xs text-white/30 mt-1">Reserved by: {room.reservedBy}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── BLE Beacon Monitor ──────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">BLE Beacon Monitor</h3>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" /> {onlineBeacons} Online
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-400" /> {weakBeacons} Weak
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" /> {offlineBeacons} Offline
            </span>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block glass-card overflow-hidden !rounded-xl">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Room</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Signal</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/50 uppercase tracking-wider">RSSI</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white/50 uppercase tracking-wider">Battery</th>
              </tr>
            </thead>
            <tbody>
              {bleBeacons.map((b) => (
                <tr key={b.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">{b.room}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><SignalBadge signal={b.signal} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">{b.rssi !== null ? `${b.rssi} dBm` : '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${b.battery > 60 ? 'bg-green-400' : b.battery > 30 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${b.battery}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/40 font-bold">{b.battery}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {bleBeacons.map((b) => (
            <div key={b.id} className="glass-card p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-white text-sm">{b.room}</h4>
                <SignalBadge signal={b.signal} />
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">RSSI:</span>
                  <span className="font-bold text-white/70">{b.rssi !== null ? `${b.rssi} dBm` : '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/40">Battery:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${b.battery > 60 ? 'bg-green-400' : b.battery > 30 ? 'bg-yellow-400' : 'bg-red-400'}`}
                        style={{ width: `${b.battery}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/40 font-bold">{b.battery}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
