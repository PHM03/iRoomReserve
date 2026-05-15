'use client';

import { getFloorDisplayLabel } from '@/lib/buildings/floorLabels';
import type { Room } from '@/lib/rooms/rooms';
import type { Schedule } from '@/lib/schedules/schedules';
import { DAY_NAMES, formatTime12h } from '@/lib/schedules/schedules';

interface AdminClassSchedulesSectionProps {
  schedules: Schedule[];
  rooms: Room[];
  showScheduleForm: boolean;
  schedRoomId: string;
  schedSubject: string;
  schedInstructor: string;
  schedDay: number;
  schedStart: string;
  schedEnd: string;
  addingSchedule: boolean;
  editingScheduleId: string | null;
  onToggleForm: () => void;
  onSchedRoomIdChange: (value: string) => void;
  onSchedSubjectChange: (value: string) => void;
  onSchedInstructorChange: (value: string) => void;
  onSchedDayChange: (value: number) => void;
  onSchedStartChange: (value: string) => void;
  onSchedEndChange: (value: string) => void;
  onSaveSchedule: () => void;
  onEditSchedule: (schedule: Schedule) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  className?: string;
}

const TIMETABLE_START_HOUR = 7;
const TIMETABLE_END_HOUR = 21;
const PIXELS_PER_HOUR = 60;
const HOUR_SLOTS = Array.from(
  { length: TIMETABLE_END_HOUR - TIMETABLE_START_HOUR + 1 },
  (_, index) => index + TIMETABLE_START_HOUR
);

function formatHourLabel(hour: number) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;

  return `${hour12}:00 ${period}`;
}

function getTimeOffset(time: string) {
  const [hours = '0', minutes = '0'] = time.split(':');

  return (
    (Number(hours) - TIMETABLE_START_HOUR) * PIXELS_PER_HOUR +
    (Number(minutes) / 60) * PIXELS_PER_HOUR
  );
}

function getScheduleBlockHeight(startTime: string, endTime: string) {
  return Math.max(getTimeOffset(endTime) - getTimeOffset(startTime), 30);
}

export default function AdminClassSchedulesSection({
  schedules,
  rooms,
  showScheduleForm,
  schedRoomId,
  schedSubject,
  schedInstructor,
  schedDay,
  schedStart,
  schedEnd,
  addingSchedule,
  editingScheduleId,
  onToggleForm,
  onSchedRoomIdChange,
  onSchedSubjectChange,
  onSchedInstructorChange,
  onSchedDayChange,
  onSchedStartChange,
  onSchedEndChange,
  onSaveSchedule,
  onEditSchedule,
  className = '',
}: Readonly<AdminClassSchedulesSectionProps>) {
  const timetableDays = DAY_NAMES.map((label, value) => ({ label, value })).filter(
    (day) => day.value >= 1 && day.value <= 6
  );
  const currentDay = new Date().getDay();
  const timetableHeight = (TIMETABLE_END_HOUR - TIMETABLE_START_HOUR) * PIXELS_PER_HOUR;

  return (
    <section
      className={`rounded-xl bg-white px-6 py-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)] ${className}`}
    >
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-xl font-bold text-black">Class Schedules</h3>
        <button
          onClick={onToggleForm}
          className="rounded-lg border-0 bg-[#8B0000] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#6e0000]"
        >
          {showScheduleForm ? 'Cancel' : '+ Add Schedule'}
        </button>
      </div>

      {showScheduleForm ? (
        <div className="mb-6 space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-black">Room</label>
              <select
                value={schedRoomId}
                onChange={(event) => onSchedRoomIdChange(event.target.value)}
                className="glass-input w-full px-4 py-2.5 text-sm"
              >
                <option value="">Select room...</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} (
                    {getFloorDisplayLabel(room.floor, {
                      id: room.buildingId,
                      name: room.buildingName,
                    })}
                    )
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-black">Day</label>
              <select
                value={schedDay}
                onChange={(event) => onSchedDayChange(Number(event.target.value))}
                className="glass-input w-full px-4 py-2.5 text-sm"
              >
                {DAY_NAMES.map((name, index) => (
                  <option key={index} value={index}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-black">Subject</label>
              <input
                value={schedSubject}
                onChange={(event) => onSchedSubjectChange(event.target.value)}
                placeholder="e.g. IT 101"
                className="glass-input w-full px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-black">
                Instructor
              </label>
              <input
                value={schedInstructor}
                onChange={(event) => onSchedInstructorChange(event.target.value)}
                placeholder="e.g. Prof. Santos"
                className="glass-input w-full px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-black">
                Start Time
              </label>
              <input
                type="time"
                value={schedStart}
                onChange={(event) => onSchedStartChange(event.target.value)}
                className="glass-input w-full px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-black">
                End Time
              </label>
              <input
                type="time"
                value={schedEnd}
                onChange={(event) => onSchedEndChange(event.target.value)}
                className="glass-input w-full px-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <button
            onClick={onSaveSchedule}
            disabled={addingSchedule || !schedRoomId || !schedSubject.trim()}
            className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
          >
            {addingSchedule
              ? 'Saving...'
              : editingScheduleId
                ? 'Update Schedule'
                : 'Add Schedule'}
          </button>
        </div>
      ) : null}

      <div className="max-h-[600px] overflow-x-auto overflow-y-auto">
        <div
          className="grid w-full"
          style={{
            gridTemplateColumns: `65px repeat(${timetableDays.length}, minmax(100px, 1fr))`,
            minWidth: '665px',
          }}
        >
            <div />
            {timetableDays.map((day) => (
              <div
                key={day.value}
                className={`border-b border-r border-[#f0f0f0] px-3 pb-2 text-center text-xs font-semibold uppercase text-[#555555] ${
                  day.value === currentDay ? 'font-bold text-[#8B0000]' : ''
                }`}
              >
                {day.label.slice(0, 3)}
              </div>
            ))}

            <div className="relative" style={{ height: timetableHeight }}>
              {HOUR_SLOTS.map((hour) => (
                <div
                key={hour}
                  className="absolute left-0 w-full pr-2 text-right text-xs text-[#999999]"
                  style={{
                    top: (hour - TIMETABLE_START_HOUR) * PIXELS_PER_HOUR - 8,
                  }}
                >
                  {formatHourLabel(hour)}
                </div>
              ))}
            </div>

            {timetableDays.map((day) => (
              <div
                key={day.value}
                className="relative border-r border-[#f0f0f0]"
                style={{ height: timetableHeight }}
              >
                {HOUR_SLOTS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 w-full border-t border-[#f0f0f0]"
                    style={{ top: (hour - TIMETABLE_START_HOUR) * PIXELS_PER_HOUR }}
                  />
                ))}

                {schedules
                  .filter((schedule) => schedule.dayOfWeek === day.value)
                  .map((schedule) => (
                    <button
                      key={schedule.id}
                      type="button"
                      onClick={() => onEditSchedule(schedule)}
                      title={`${schedule.subjectName} | ${schedule.roomName} · ${schedule.instructorName} | ${formatTime12h(schedule.startTime)} - ${formatTime12h(schedule.endTime)}`}
                      className="absolute left-2 right-2 overflow-hidden rounded-md border-l-[3px] border-[#8B0000] bg-[#fde8e8] px-2 py-1 text-left text-xs transition-all hover:bg-[#f9c8c8] hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
                      style={{
                        top: getTimeOffset(schedule.startTime),
                        height: getScheduleBlockHeight(
                          schedule.startTime,
                          schedule.endTime
                        ),
                      }}
                    >
                      <p className="truncate font-semibold text-[#8B0000]">
                        {schedule.subjectName}
                      </p>
                      <p className="truncate text-[11px] text-[#666666]">
                        {schedule.roomName} · {schedule.instructorName}
                      </p>
                    </button>
                  ))}
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
