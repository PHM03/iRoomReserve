'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  onPendingReservationsByBuilding,
  approveReservation,
  rejectReservation,
  Reservation,
} from '@/lib/reservations';
import {
  onUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  Notification,
} from '@/lib/notifications';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ─── Types ──────────────────────────────────────────────────────
interface Room {
  id: string;
  name: string;
  floor: string;
  status: string;
  reservedBy: string | null;
}

interface BleBeacon {
  id: string;
  room: string;
  signal: string;
  rssi: number | null;
  battery: number;
}

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
  const { firebaseUser, profile } = useAuth();
  const buildingId = profile?.assignedBuildingId;
  const buildingName = profile?.assignedBuilding;

  // ─── State ──────────────────────────────────────────────────
  const [requests, setRequests] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bleBeacons, setBleBeacons] = useState<BleBeacon[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ─── Real-time Listeners ────────────────────────────────────
  useEffect(() => {
    if (!buildingId || !firebaseUser) return;

    // 1. Pending reservations for this building
    const unsubReservations = onPendingReservationsByBuilding(buildingId, setRequests);

    // 2. Rooms for this building
    const roomsQuery = query(
      collection(db, 'rooms'),
      where('buildingId', '==', buildingId)
    );
    const unsubRooms = onSnapshot(roomsQuery, (snapshot) => {
      const r: Room[] = snapshot.docs.map((d) => ({
        id: d.id,
        name: d.data().name || '',
        floor: d.data().floor || '',
        status: d.data().status || 'Available',
        reservedBy: d.data().reservedBy || null,
      }));
      setRooms(r);
    });


    // 4. Notifications for this admin
    const unsubNotifs = onUnreadNotifications(firebaseUser.uid, setNotifications);

    return () => {
      unsubReservations();
      unsubRooms();
      unsubNotifs();
    };
  }, [buildingId, firebaseUser]);

  // ─── Handlers ───────────────────────────────────────────────
  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try { await approveReservation(id); } catch (err) { console.error('Failed to approve:', err); }
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try { await rejectReservation(id); } catch (err) { console.error('Failed to reject:', err); }
    setActionLoading(null);
  };

  const handleMarkAllRead = async () => {
    if (!firebaseUser) return;
    await markAllNotificationsRead(firebaseUser.uid);
  };

  const handleDismissNotification = async (notifId: string) => {
    await markNotificationRead(notifId);
  };

  // ─── Computed Values ────────────────────────────────────────
  const onlineBeacons = bleBeacons.filter(b => b.signal === 'Online').length;
  const weakBeacons = bleBeacons.filter(b => b.signal === 'Weak').length;
  const offlineBeacons = bleBeacons.filter(b => b.signal === 'Offline').length;

  // ─── No Building Assigned State ─────────────────────────────
  if (!buildingId || !buildingName) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Welcome, {firstName} 🏛️</h2>
          <p className="text-white/40 mt-1">Administrator Dashboard</p>
        </div>
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white/60 mb-2">No Building Assigned</h3>
          <p className="text-sm text-white/30 max-w-sm mx-auto">
            Your account has been approved, but the Super Admin has not yet assigned a building to you.
            Please contact the Super Admin to get a building assignment.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
      {/* Welcome */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Welcome, {firstName} 🏛️</h2>
          <p className="text-white/40 mt-1">
            Managing: <span className="text-primary font-bold">{buildingName}</span>
          </p>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl glass-card !p-2.5 hover:!border-primary/40 transition-all"
          >
            <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-card !rounded-xl overflow-hidden z-50">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h4 className="font-bold text-white text-sm">Notifications</h4>
                {notifications.length > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary font-bold hover:text-primary-hover transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sm text-white/30">No new notifications</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white">{notif.title}</p>
                        <p className="text-[11px] text-white/40 mt-0.5">{notif.message}</p>
                      </div>
                      <button
                        onClick={() => handleDismissNotification(notif.id)}
                        className="text-white/20 hover:text-white/50 transition-colors shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
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
          <p className="text-2xl font-bold text-blue-400">{notifications.length}</p>
          <p className="text-xs text-white/50 font-bold">New Notifications</p>
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
                      {req.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{req.userName}</h4>
                        <RoleBadge role={req.userRole} />
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">
                        {req.roomName} · {req.date} · {req.startTime} – {req.endTime}
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
        <h3 className="text-xl font-bold text-white mb-4">
          Live Room Status
          <span className="text-sm text-white/30 font-normal ml-2">({buildingName})</span>
        </h3>
        {rooms.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-sm text-white/30">No rooms configured for this building yet.</p>
          </div>
        ) : (
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
        )}
      </div>

      {/* ─── BLE Beacon Monitor ──────────────────────────────────── */}
      {bleBeacons.length > 0 && (
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
      )}
    </main>
  );
}
