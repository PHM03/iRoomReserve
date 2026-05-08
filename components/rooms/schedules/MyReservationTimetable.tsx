import type { Reservation } from '@/lib/reservations/reservations';
import { formatTimeRange } from '@/lib/utils/dateTime';

type MyReservationTimetableProps = {
  className?: string;
  compact?: boolean;
  currentUserId?: string | null;
  reservations: Reservation[];
};

type TimetableEntry = {
  buildingName: string;
  campus: Reservation['campus'];
  endTime: string;
  roomName: string;
  startTime: string;
  purpose?: string;
};

const TIMETABLE_DAYS = [
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
] as const;

function getCampusLabel(campus: Reservation['campus']) {
  return campus === 'digi' ? 'SDCA Digi Campus' : 'SDCA Main Campus';
}

function getReservationDates(reservation: Reservation) {
  const dates = reservation.dates?.length ? reservation.dates : [reservation.date];
  return [...new Set(dates.filter(Boolean))];
}

function getWeekdayValue(dateValue: string) {
  const [year, month, day] = dateValue.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const weekday = new Date(year, month - 1, day).getDay();
  return weekday >= 1 && weekday <= 6 ? weekday : null;
}

function buildEntriesByDay(
  reservations: Reservation[],
  currentUserId?: string | null
) {
  const entriesByDay = new Map<number, Map<string, TimetableEntry>>();

  TIMETABLE_DAYS.forEach((day) => {
    entriesByDay.set(day.value, new Map());
  });

  reservations.forEach((reservation) => {
    if (
      !currentUserId ||
      reservation.userId !== currentUserId ||
      reservation.status !== 'approved'
    ) {
      return;
    }

    getReservationDates(reservation).forEach((date) => {
      const weekday = getWeekdayValue(date);

      if (!weekday) {
        return;
      }

      const dayEntries = entriesByDay.get(weekday);

      if (!dayEntries) {
        return;
      }

      const key = [
        reservation.roomId,
        reservation.buildingId,
        reservation.startTime,
        reservation.endTime,
      ].join(':');

      if (!dayEntries.has(key)) {
        dayEntries.set(key, {
          buildingName: reservation.buildingName,
          campus: reservation.campus,
          endTime: reservation.endTime,
          roomName: reservation.roomName,
          startTime: reservation.startTime,
          purpose: reservation.purpose,
        });
      }
    });
  });

  return entriesByDay;
}

export default function MyReservationTimetable({
  className,
  compact = false,
  currentUserId,
  reservations,
}: MyReservationTimetableProps) {
  const entriesByDay = buildEntriesByDay(reservations, currentUserId);

  if (compact) {
    return (
      <section className={className}>
        <div className="mb-2 flex items-center justify-between rounded-xl border border-white/30 bg-white px-3 py-2">
          <h3 className="text-sm font-bold text-gray-800">My Reservation Timetable</h3>
          <span className="text-[11px] font-bold text-gray-500">Weekly strip</span>
        </div>

        <div className="glass-card !rounded-xl p-2">
          <div className="grid grid-cols-6 gap-2">
            {TIMETABLE_DAYS.map((day) => {
              const entries = [...(entriesByDay.get(day.value)?.values() ?? [])].sort(
                (left, right) =>
                  left.startTime.localeCompare(right.startTime) ||
                  left.roomName.localeCompare(right.roomName, undefined, {
                    numeric: true,
                  })
              );

              return (
                <div
                  key={day.value}
                  className="min-h-[112px] rounded-lg border border-dark/10 bg-white/70 p-2"
                >
                  <h4 className="mb-1.5 truncate text-xs font-extrabold text-black">
                    {day.label.slice(0, 3)}
                  </h4>

                  {entries.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-dark/10 bg-dark/3 px-1.5 py-4 text-center text-[10px] font-bold text-black/45">
                      None
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {entries.slice(0, 2).map((entry) => (
                        <div
                          key={`${entry.buildingName}:${entry.roomName}:${entry.startTime}:${entry.endTime}`}
                          className="rounded-lg border border-green-500/20 bg-green-500/10 px-2 py-1.5"
                        >
                          <p className="truncate text-[11px] font-bold text-black">
                            {entry.roomName}
                          </p>
                          <p className="truncate text-[10px] font-bold text-primary">
                            {formatTimeRange(entry.startTime, entry.endTime)}
                          </p>
                        </div>
                      ))}
                      {entries.length > 2 && (
                        <p className="text-center text-[10px] font-bold text-black/55">
                          +{entries.length - 2} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={className}>
      <div className="bg-white rounded-xl px-6 py-4 mb-4 border border-white/30">
        <h3 className="text-xl font-bold text-gray-800">
          My Reservation Timetable
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Weekly recurring schedule
        </p>
      </div>

      <div className="glass-card !rounded-xl p-4 overflow-x-auto">
        <div className="grid min-w-[900px] grid-cols-6 gap-3">
          {TIMETABLE_DAYS.map((day) => {
            const entries = [...(entriesByDay.get(day.value)?.values() ?? [])].sort(
              (left, right) =>
                left.startTime.localeCompare(right.startTime) ||
                left.roomName.localeCompare(right.roomName, undefined, {
                  numeric: true,
                })
            );

            return (
              <div
                key={day.value}
                className="rounded-xl border border-dark/10 bg-white/70 p-3 min-h-[190px]"
              >
                <h4 className="text-sm font-extrabold text-black mb-3">
                  {day.label}
                </h4>

                {entries.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-dark/10 bg-dark/3 px-3 py-6 text-center">
                    <p className="text-xs font-bold text-black/50">
                      No reservations
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {entries.map((entry) => (
                      <div
                        key={`${entry.buildingName}:${entry.roomName}:${entry.startTime}:${entry.endTime}`}
                        className="rounded-xl border border-green-500/20 bg-green-500/10 p-3"
                      >
                        <p className="text-sm font-bold text-black">
                          {entry.roomName}
                        </p>
                        <p className="text-xs text-black mt-1">
                          {entry.buildingName} | {getCampusLabel(entry.campus)}
                        </p>
                        <p className="text-xs font-bold text-primary mt-2">
                          {formatTimeRange(entry.startTime, entry.endTime)}
                        </p>
                        {entry.purpose && (
                          <p className="text-[11px] text-black/60 mt-1 line-clamp-2">
                            {entry.purpose}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
