'use client';

import React, { useMemo, useState } from 'react';

import { formatTime } from '@/lib/dateTime';
import type { EnrichedBookingSlot, UserActiveSlot } from '@/lib/roomAvailability';

/* ──────────────────────────── Types ──────────────────────────── */

type SlotStatus =
  | 'available'
  | 'reserved-others'
  | 'pending-others'
  | 'user-conflict';

interface TimeSlot {
  startTime: string;
  endTime: string;
  status: SlotStatus;
  /** The reservation that causes this status, if any. */
  conflictRoomName?: string;
}

interface DaySchedulePanelProps {
  /** ISO date string (yyyy-MM-dd) for the day being displayed. */
  date: string;
  /** All approved + pending reservations for THIS room on any date. */
  roomEnrichedSlots: readonly EnrichedBookingSlot[];
  /** All of the current user's active reservations across ALL rooms. */
  userActiveSlots: readonly UserActiveSlot[];
  /** Firebase UID of the logged-in user. */
  currentUserId: string;
  /** Current room ID, used to exclude user's own reservations for THIS room from cross-room check. */
  currentRoomId: string;
  /** Campus operating hours. */
  campusTimeRange: { startMinutes: number; endMinutes: number };
  /** Called when user clicks an available slot to pre-fill start/end time. */
  onSelectSlot: (startTime: string, endTime: string) => void;
  /** Called when user wants to see alternative rooms (from a reserved slot). */
  onRequestAlternatives: () => void;
}

/* ──────────────────────────── Helpers ─────────────────────────── */

function minutesToTimeString(value: number): string {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function slotsOverlap(
  slotStart: string,
  slotEnd: string,
  rangeStart: string,
  rangeEnd: string
): boolean {
  return slotStart < rangeEnd && slotEnd > rangeStart;
}

/* ──────────────────────────── Component ──────────────────────── */

export default function DaySchedulePanel({
  date,
  roomEnrichedSlots,
  userActiveSlots,
  currentUserId,
  currentRoomId,
  campusTimeRange,
  onSelectSlot,
  onRequestAlternatives,
}: DaySchedulePanelProps) {
  const [toast, setToast] = useState<{
    message: string;
    type: 'info' | 'warning' | 'error';
  } | null>(null);

  // Build 30-minute slot grid for the selected date
  const timeSlots = useMemo<TimeSlot[]>(() => {
    const slots: TimeSlot[] = [];
    const { startMinutes, endMinutes } = campusTimeRange;

    // Filter to only this date's data
    const roomSlotsForDate = roomEnrichedSlots.filter(
      (s) => s.date === date
    );
    const userSlotsForDate = userActiveSlots.filter(
      (s) => s.date === date
    );

    for (let mins = startMinutes; mins < endMinutes; mins += 30) {
      const slotStart = minutesToTimeString(mins);
      const slotEnd = minutesToTimeString(mins + 30);

      // 1. Check if this slot overlaps an approved reservation by ANOTHER user on THIS room
      const roomApprovedConflict = roomSlotsForDate.find(
        (s) =>
          s.status === 'approved' &&
          s.userId !== currentUserId &&
          slotsOverlap(slotStart, slotEnd, s.startTime, s.endTime)
      );

      if (roomApprovedConflict) {
        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          status: 'reserved-others',
        });
        continue;
      }

      // 2. Check if the CURRENT USER has an active reservation at this time in ANY OTHER room
      const userCrossRoomConflict = userSlotsForDate.find(
        (s) =>
          s.roomId !== currentRoomId &&
          slotsOverlap(slotStart, slotEnd, s.startTime, s.endTime)
      );

      if (userCrossRoomConflict) {
        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          status: 'user-conflict',
          conflictRoomName: userCrossRoomConflict.roomName,
        });
        continue;
      }

      // 3. Check if this slot overlaps a pending reservation by ANOTHER user on THIS room
      const roomPendingConflict = roomSlotsForDate.find(
        (s) =>
          s.status === 'pending' &&
          s.userId !== currentUserId &&
          slotsOverlap(slotStart, slotEnd, s.startTime, s.endTime)
      );

      if (roomPendingConflict) {
        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          status: 'pending-others',
        });
        continue;
      }

      // 4. Available
      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        status: 'available',
      });
    }

    return slots;
  }, [
    campusTimeRange,
    currentRoomId,
    currentUserId,
    date,
    roomEnrichedSlots,
    userActiveSlots,
  ]);

  function handleSlotClick(slot: TimeSlot) {
    switch (slot.status) {
      case 'available':
        onSelectSlot(slot.startTime, slot.endTime);
        break;

      case 'reserved-others':
        setToast({
          message:
            'This slot is already reserved. Would you like to see alternative rooms?',
          type: 'warning',
        });
        break;

      case 'user-conflict':
        setToast({
          message: `Only one reservation at a time. You already have a booking at ${slot.conflictRoomName || 'another room'} during this time.`,
          type: 'error',
        });
        break;

      case 'pending-others':
        setToast({
          message:
            'This slot has a pending reservation from another user. You can still attempt to book, but it may conflict.',
          type: 'info',
        });
        break;
    }
  }

  function dismissToast() {
    setToast(null);
  }

  function getSlotClasses(status: SlotStatus): string {
    const base =
      'schedule-slot flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all cursor-pointer';

    switch (status) {
      case 'available':
        return `${base} schedule-slot-available`;
      case 'reserved-others':
        return `${base} schedule-slot-reserved`;
      case 'user-conflict':
        return `${base} schedule-slot-conflict`;
      case 'pending-others':
        return `${base} schedule-slot-pending`;
      default:
        return base;
    }
  }

  function getStatusIcon(status: SlotStatus) {
    switch (status) {
      case 'available':
        return (
          <svg
            className="h-3.5 w-3.5 shrink-0 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case 'reserved-others':
        return (
          <svg
            className="h-3.5 w-3.5 shrink-0 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case 'user-conflict':
        return (
          <svg
            className="h-3.5 w-3.5 shrink-0 text-red-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        );
      case 'pending-others':
        return (
          <svg
            className="h-3.5 w-3.5 shrink-0 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 6v6l4 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        );
    }
  }

  function getStatusLabel(status: SlotStatus): string {
    switch (status) {
      case 'available':
        return 'Available';
      case 'reserved-others':
        return 'Reserved';
      case 'user-conflict':
        return 'Your conflict';
      case 'pending-others':
        return 'Pending';
      default:
        return '';
    }
  }

  function getToastClasses(type: 'info' | 'warning' | 'error'): string {
    switch (type) {
      case 'info':
        return 'border-blue-300/60 bg-blue-50/95 text-blue-800';
      case 'warning':
        return 'border-amber-300/60 bg-amber-50/95 text-amber-800';
      case 'error':
        return 'border-red-300/60 bg-red-50/95 text-red-800';
    }
  }

  // Count available vs total
  const availableCount = timeSlots.filter(
    (s) => s.status === 'available'
  ).length;

  return (
    <div className="relative">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h5 className="text-sm font-bold text-black">Day Schedule</h5>
          <p className="mt-0.5 text-[11px] text-black/60">
            {availableCount} of {timeSlots.length} slots available
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-dark/10 bg-dark/5 px-2.5 py-1 text-[10px] font-bold text-black/60">
          30-min slots
        </span>
      </div>

      {/* Legend */}
      <div className="mb-3 flex flex-wrap gap-2 text-[10px] font-bold">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-white border border-green-400/60" />
          Available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-100 border border-red-300/60" />
          Reserved
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-100 border border-amber-300/60" />
          Pending
        </span>
      </div>

      {/* Slot Grid */}
      <div className="schedule-panel-scroll max-h-[22rem] space-y-1.5 overflow-y-auto pr-1">
        {timeSlots.map((slot) => (
          <button
            key={slot.startTime}
            type="button"
            onClick={() => handleSlotClick(slot)}
            className={getSlotClasses(slot.status)}
          >
            {getStatusIcon(slot.status)}
            <span className="min-w-[5.5rem] text-left">
              {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
            </span>
            <span className="ml-auto text-[10px] opacity-70">
              {getStatusLabel(slot.status)}
            </span>
          </button>
        ))}
      </div>

      {/* Toast / Action Prompt */}
      {toast && (
        <div
          className={`mt-3 rounded-xl border p-3 text-xs font-bold animate-in ${getToastClasses(
            toast.type
          )}`}
        >
          <p>{toast.message}</p>
          <div className="mt-2.5 flex items-center gap-2">
            {toast.type === 'warning' && (
              <button
                type="button"
                onClick={() => {
                  dismissToast();
                  onRequestAlternatives();
                }}
                className="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-primary-hover"
              >
                See Alternatives
              </button>
            )}
            <button
              type="button"
              onClick={dismissToast}
              className="rounded-lg border border-dark/10 bg-white px-3 py-1.5 text-[11px] font-bold text-black transition-all hover:bg-dark/5"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
