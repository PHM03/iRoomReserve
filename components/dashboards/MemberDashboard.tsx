'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  checkInReservation,
  onReservationsByUser,
  Reservation,
} from '@/lib/reservations';
import {
  markAllNotificationsRead,
  markNotificationRead,
  Notification,
  onUnreadNotifications,
} from '@/lib/notifications';
import {
  DAY_NAMES,
  formatTime12h,
  onSchedulesByBuildingIds,
  Schedule,
} from '@/lib/schedules';
import { onRoomsByIds, Room } from '@/lib/rooms';
import StatusBadge from '@/components/StatusBadge';
import {
  canReservationCheckIn,
  compareReservationSchedule,
  getLocalDateString,
  getReservationRoomStatus,
} from '@/lib/roomStatus';

interface MemberDashboardProps {
  firstName: string;
  welcomeEmoji: string;
}

export default function MemberDashboard({
  firstName,
  welcomeEmoji,
}: MemberDashboardProps) {
  const { firebaseUser } = useAuth();
  const [reservationHistory, setReservationHistory] = useState<Reservation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [checkInLoading, setCheckInLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseUser) {
      return;
    }

    const unsubscribeReservations = onReservationsByUser(
      firebaseUser.uid,
      setReservationHistory
    );
    const unsubscribeNotifications = onUnreadNotifications(
      firebaseUser.uid,
      setNotifications
    );

    return () => {
      unsubscribeReservations();
      unsubscribeNotifications();
    };
  }, [firebaseUser]);

  useEffect(() => {
    const roomIds = [...new Set(reservationHistory.map((reservation) => reservation.roomId))];
    const buildingIds = [
      ...new Set(reservationHistory.map((reservation) => reservation.buildingId)),
    ];

    const unsubscribeRooms = onRoomsByIds(roomIds, setRooms);
    const unsubscribeSchedules = onSchedulesByBuildingIds(buildingIds, setSchedules);

    return () => {
      unsubscribeRooms();
      unsubscribeSchedules();
    };
  }, [reservationHistory]);

  const roomLookup = Object.fromEntries(
    rooms.map((room) => [room.id, room] as const)
  ) as Record<string, Room | undefined>;

  const getRoomStatus = (reservation: Reservation) =>
    getReservationRoomStatus(reservation, roomLookup[reservation.roomId]);
  const canCheckIn = (reservation: Reservation) =>
    canReservationCheckIn(reservation) &&
    getRoomStatus(reservation) !== 'Unavailable';

  const handleMarkAllRead = async () => {
    if (!firebaseUser) {
      return;
    }

    await markAllNotificationsRead(firebaseUser.uid);
  };

  const handleCheckIn = async (reservationId: string) => {
    if (!firebaseUser) {
      return;
    }

    setCheckInLoading(reservationId);

    try {
      await checkInReservation(reservationId, firebaseUser.uid);
    } catch (error) {
      console.error('Failed to check in:', error);
    }

    setCheckInLoading(null);
  };

  const pendingCount = reservationHistory.filter(
    (reservation) => reservation.status === 'pending'
  ).length;
  const approvedReservations = [...reservationHistory]
    .filter((reservation) => reservation.status === 'approved')
    .sort(compareReservationSchedule);
  const approvedCount = approvedReservations.length;
  const activeReservation =
    approvedReservations.find(
      (reservation) =>
        reservation.checkedInAt || reservation.date === getLocalDateString()
    ) ?? approvedReservations[0];

  const today = getLocalDateString();
  const upcomingReservations = approvedReservations
    .filter((reservation) => reservation.date >= today)
    .slice(0, 3);
  const recentActivity = reservationHistory.slice(0, 5);

  const todayDay = new Date().getDay();
  const todaySchedules = schedules.filter(
    (schedule) => schedule.dayOfWeek === todayDay
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 pb-24 md:pb-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Welcome back, {firstName} {welcomeEmoji}
          </h2>
          <p className="text-white/40 mt-1">
            Here&apos;s an overview of your reservations
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl glass-card !p-2.5 hover:!border-primary/40 transition-all"
          >
            <svg
              className="w-5 h-5 text-white/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 !rounded-xl overflow-hidden z-50 bg-[#1a1a2e]/95 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/40">
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
                    <p className="text-sm text-white/50">No new notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors flex items-start gap-3"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          notification.type === 'reservation_approved'
                            ? 'bg-green-500/20'
                            : notification.type === 'reservation_rejected'
                              ? 'bg-red-500/20'
                              : 'bg-primary/20'
                        }`}
                      >
                        <svg
                          className={`w-4 h-4 ${
                            notification.type === 'reservation_approved'
                              ? 'text-green-400'
                              : notification.type === 'reservation_rejected'
                                ? 'text-red-400'
                                : 'text-primary'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {notification.type === 'reservation_approved' ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          ) : notification.type === 'reservation_rejected' ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                          )}
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white">
                          {notification.title}
                        </p>
                        <p className="text-[11px] text-white/70 mt-0.5">
                          {notification.message}
                        </p>
                      </div>
                      <button
                        onClick={() => markNotificationRead(notification.id)}
                        className="text-white/20 hover:text-white/50 transition-colors shrink-0"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <span className="text-xs text-white/40 font-bold">Current Room</span>
          </div>
          {activeReservation ? (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white">
                  {activeReservation.roomName}
                </h3>
                <StatusBadge status={getRoomStatus(activeReservation)} />
              </div>
              <p className="text-xs text-white/40 mt-2">
                {activeReservation.buildingName}
              </p>
              <p className="text-[10px] text-white/30 mt-0.5">
                {activeReservation.date} | {activeReservation.startTime} -{' '}
                {activeReservation.endTime}
              </p>
              <div className="flex items-center gap-2 flex-wrap mt-3">
                <StatusBadge status={activeReservation.status} />
                {canCheckIn(activeReservation) && (
                  <button
                    onClick={() => handleCheckIn(activeReservation.id)}
                    disabled={checkInLoading === activeReservation.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-500/15 text-orange-300 border border-orange-500/25 hover:bg-orange-500/20 transition-all disabled:opacity-50"
                  >
                    {checkInLoading === activeReservation.id
                      ? 'Checking in...'
                      : 'Check-in'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-white/30 font-bold">No active room</p>
              <p className="text-[10px] text-white/20 mt-0.5">
                You have no approved reservation right now
              </p>
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <span className="text-xs text-white/40 font-bold">
              Pending Requests
            </span>
          </div>
          <h3 className="text-3xl font-bold text-white">{pendingCount}</h3>
          <p className="text-xs text-white/30 mt-0.5">Awaiting approval</p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span className="text-xs text-white/40 font-bold">Approved</span>
          </div>
          <h3 className="text-3xl font-bold text-white">{approvedCount}</h3>
          <p className="text-xs text-white/30 mt-0.5">Ready to use</p>
        </div>
      </div>

      <Link
        href="/dashboard/reserve"
        className="w-full glass-card p-5 !rounded-2xl flex items-center justify-center gap-3 mb-8 group hover:!border-primary/40 transition-all cursor-pointer block"
      >
        <svg
          className="w-6 h-6 text-white/40 group-hover:text-primary transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span className="text-lg font-bold text-white/60 group-hover:text-white transition-colors">
          New Reservation
        </span>
      </Link>

      {upcomingReservations.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Upcoming Reservations</h3>
            <Link
              href="/dashboard/reservations"
              className="text-sm text-primary font-bold hover:text-primary-hover transition-colors"
            >
              View all -&gt;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {upcomingReservations.map((reservation) => (
              <div key={reservation.id} className="glass-card p-4 !rounded-xl">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-sm font-bold text-white">
                    {reservation.roomName}
                  </h4>
                  <StatusBadge status={getRoomStatus(reservation)} />
                </div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <StatusBadge status={reservation.status} />
                  {canCheckIn(reservation) && (
                    <button
                      onClick={() => handleCheckIn(reservation.id)}
                      disabled={checkInLoading === reservation.id}
                      className="px-3 py-1 rounded-lg text-[11px] font-bold bg-orange-500/15 text-orange-300 border border-orange-500/25 hover:bg-orange-500/20 transition-all disabled:opacity-50"
                    >
                      {checkInLoading === reservation.id
                        ? 'Checking in...'
                        : 'Check-in'}
                    </button>
                  )}
                </div>
                <p className="text-xs text-white/40">{reservation.buildingName}</p>
                <div className="flex items-center gap-2 mt-2">
                  <svg
                    className="w-3.5 h-3.5 text-white/30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xs text-white/30">{reservation.date}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <svg
                    className="w-3.5 h-3.5 text-white/30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs text-white/30">
                    {reservation.startTime} - {reservation.endTime}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Recent Activity</h3>
            <Link
              href="/dashboard/reservations"
              className="text-sm text-primary font-bold hover:text-primary-hover transition-colors"
            >
              View all -&gt;
            </Link>
          </div>
          <div className="glass-card !rounded-xl overflow-hidden">
            {recentActivity.length === 0 ? (
              <div className="p-12 text-center">
                <svg
                  className="w-14 h-14 text-white/8 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <p className="text-sm text-white/30 font-bold">No activity yet</p>
                <p className="text-xs text-white/15 mt-1">
                  Your reservation history will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentActivity.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                  >
                    <span
                      className={`w-2.5 h-full min-h-[40px] rounded-full shrink-0 ${
                        reservation.status === 'approved'
                          ? 'bg-green-400'
                          : reservation.status === 'rejected'
                            ? 'bg-red-400'
                            : reservation.status === 'completed'
                              ? 'bg-yellow-400'
                              : reservation.status === 'cancelled'
                                ? 'bg-gray-400'
                                : reservation.status === 'pending'
                                  ? 'bg-blue-400'
                                  : 'bg-white/30'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white">
                        {reservation.roomName} | {reservation.buildingName}
                      </h4>
                      <p className="text-xs text-white/35 mt-0.5">
                        {reservation.date} | {reservation.startTime} -{' '}
                        {reservation.endTime}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={reservation.status} />
                      <StatusBadge status={getRoomStatus(reservation)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-white mb-4">
            Today&apos;s Class Schedules
            <span className="text-sm text-white/30 font-normal ml-2">
              ({DAY_NAMES[todayDay]})
            </span>
          </h3>
          <div className="glass-card !rounded-xl overflow-hidden">
            {todaySchedules.length === 0 ? (
              <div className="p-12 text-center">
                <svg
                  className="w-14 h-14 text-white/8 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm text-white/30 font-bold">No classes today</p>
                <p className="text-xs text-white/15 mt-1">
                  No scheduled classes for today
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {todaySchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {schedule.subjectName}
                        </h4>
                        <p className="text-xs text-white/40 mt-0.5">
                          {schedule.instructorName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">
                          {formatTime12h(schedule.startTime)} -{' '}
                          {formatTime12h(schedule.endTime)}
                        </p>
                        <p className="text-[10px] text-white/30">
                          {schedule.roomName}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
