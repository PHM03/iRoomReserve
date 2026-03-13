'use client';

import React, { useState } from 'react';

// ─── Mock Data ──────────────────────────────────────────────────
const todaySchedule = [
  { id: 1, subject: 'IT 101 — Intro to Computing', room: 'Room 101', time: '08:00 – 09:30', roomStatus: 'Occupied' },
  { id: 2, subject: 'IT 202 — Data Structures', room: 'Room 201', time: '10:00 – 11:30', roomStatus: 'Vacant' },
  { id: 3, subject: 'IT 303 — Web Development', room: 'Room 302', time: '13:00 – 14:30', roomStatus: 'Occupied' },
  { id: 4, subject: 'IT 404 — Software Engineering', room: 'Room 102', time: '15:00 – 16:30', roomStatus: 'Vacant' },
];

const rooms = [
  { id: 1, name: 'Room 101', floor: '1st Floor', status: 'Occupied' },
  { id: 2, name: 'Room 102', floor: '1st Floor', status: 'Vacant' },
  { id: 3, name: 'Room 201', floor: '2nd Floor', status: 'Occupied' },
  { id: 4, name: 'Room 202', floor: '2nd Floor', status: 'Available' },
  { id: 5, name: 'Room 301', floor: '3rd Floor', status: 'Available' },
  { id: 6, name: 'Room 302', floor: '3rd Floor', status: 'Occupied' },
];

const bleBeacons = [
  { id: 1, room: 'Room 101', signal: 'Online', rssi: -42 },
  { id: 2, room: 'Room 102', signal: 'Weak', rssi: -78 },
  { id: 3, room: 'Room 201', signal: 'Online', rssi: -38 },
  { id: 4, room: 'Room 202', signal: 'Offline', rssi: null },
  { id: 5, room: 'Room 301', signal: 'Online', rssi: -45 },
  { id: 6, room: 'Room 302', signal: 'Weak', rssi: -82 },
];

// ─── Helpers ────────────────────────────────────────────────────
function RoomStatusDot({ status }: { status: string }) {
  const color = status === 'Occupied' ? 'bg-orange-400' : status === 'Vacant' ? 'bg-gray-400' : 'bg-green-400';
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />;
}

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

// ─── Component ──────────────────────────────────────────────────
interface FacultyDashboardProps {
  firstName: string;
}

export default function FacultyDashboard({ firstName }: FacultyDashboardProps) {
  const [sidebarTab, setSidebarTab] = useState<'schedule' | 'ble'>('schedule');

  // Find next upcoming class (mock: second class)
  const nextClass = todaySchedule[1];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
      {/* Welcome */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Good day, {firstName} 📚</h2>
        <p className="text-white/40 mt-1">Here&apos;s your teaching schedule and room status for today</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ─── Main Content (left) ─────────────────────────────── */}
        <div className="flex-1 space-y-6">
          {/* Next Class Check-In Prompt */}
          <div className="glass-card p-6 border-l-4 border-primary/60">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-1">Next Class</p>
                <h3 className="text-lg font-bold text-white">{nextClass.subject}</h3>
                <p className="text-sm text-white/50 mt-1">{nextClass.room} · {nextClass.time}</p>
              </div>
              <button className="btn-primary px-5 py-2.5 text-sm shrink-0">
                Check In
              </button>
            </div>
          </div>

          {/* Today's Class Schedule */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Today&apos;s Schedule</h3>
            <div className="space-y-3">
              {todaySchedule.map((cls) => (
                <div key={cls.id} className="glass-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {cls.time.split('–')[0].trim().slice(0, 5)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{cls.subject}</h4>
                      <p className="text-xs text-white/40 mt-0.5">{cls.room} · {cls.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <RoomStatusDot status={cls.roomStatus} />
                    <span className="text-white/50 font-bold text-xs">{cls.roomStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Room Status Grid */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Room Status — Live</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => {
                const statusColor = room.status === 'Occupied'
                  ? 'border-orange-500/40'
                  : room.status === 'Vacant'
                    ? 'border-gray-500/40'
                    : 'border-green-500/40';
                const statusBg = room.status === 'Occupied'
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                  : room.status === 'Vacant'
                    ? 'bg-white/10 text-white/50 border-white/20'
                    : 'bg-green-500/20 text-green-300 border-green-500/30';

                return (
                  <div key={room.id} className={`glass-card p-5 border-l-4 ${statusColor}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-bold text-white">{room.name}</h4>
                        <p className="text-sm text-white/40">{room.floor}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBg}`}>
                        {room.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Sidebar (right) ─────────────────────────────────── */}
        <div className="lg:w-80 shrink-0 space-y-4">
          {/* Sidebar Tabs */}
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
            <button
              onClick={() => setSidebarTab('schedule')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                sidebarTab === 'schedule'
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              📅 Schedule
            </button>
            <button
              onClick={() => setSidebarTab('ble')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                sidebarTab === 'ble'
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              📡 BLE Monitor
            </button>
          </div>

          {sidebarTab === 'schedule' ? (
            /* Class Schedule Sidebar */
            <div className="glass-card p-4 !rounded-xl">
              <h4 className="text-sm font-bold text-white/70 mb-3">Full Schedule</h4>
              <div className="space-y-3">
                {todaySchedule.map((cls) => (
                  <div key={cls.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/3 hover:bg-white/5 transition-colors">
                    <RoomStatusDot status={cls.roomStatus} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{cls.subject}</p>
                      <p className="text-[10px] text-white/40">{cls.time} · {cls.room}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* BLE Beacon Monitor Sidebar */
            <div className="glass-card p-4 !rounded-xl">
              <h4 className="text-sm font-bold text-white/70 mb-3">BLE Beacons</h4>
              <div className="space-y-2.5">
                {bleBeacons.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/3 hover:bg-white/5 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-white">{b.room}</p>
                      {b.rssi !== null && (
                        <p className="text-[10px] text-white/30">RSSI: {b.rssi} dBm</p>
                      )}
                    </div>
                    <SignalBadge signal={b.signal} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="glass-card p-4 !rounded-xl">
            <h4 className="text-sm font-bold text-white/70 mb-3">Today&apos;s Summary</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-lg bg-white/3">
                <p className="text-xl font-bold text-white">{todaySchedule.length}</p>
                <p className="text-[10px] text-white/40 font-bold">Classes</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/3">
                <p className="text-xl font-bold text-green-400">{rooms.filter(r => r.status === 'Available').length}</p>
                <p className="text-[10px] text-white/40 font-bold">Available</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/3">
                <p className="text-xl font-bold text-orange-400">{rooms.filter(r => r.status === 'Occupied').length}</p>
                <p className="text-[10px] text-white/40 font-bold">Occupied</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/3">
                <p className="text-xl font-bold text-blue-400">{bleBeacons.filter(b => b.signal === 'Online').length}</p>
                <p className="text-[10px] text-white/40 font-bold">Beacons OK</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
