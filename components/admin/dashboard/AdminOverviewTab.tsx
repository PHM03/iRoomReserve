import BleSummaryCard from '@/components/ui/BleSummaryCard';
import MyReservationTimetable from '@/components/rooms/schedules/MyReservationTimetable';
import type { AdminTab } from '@/components/layout/NavBar';
import { getFloorDisplayLabel } from '@/lib/buildings/floorLabels';
import type { Reservation } from '@/lib/reservations/reservations';
import type { Room } from '@/lib/rooms/rooms';
import { formatTimeRange } from '@/lib/utils/dateTime';
import { formatReservationDates, RoleBadge, StatusBadge } from './shared';

interface AdminOverviewTabProps {
  allReservations: Reservation[];
  availableCount: number;
  buildingId: string;
  buildingName: string;
  computeEffectiveStatus: (room: Room) => { status: string; detail: string };
  currentUserId?: string | null;
  ongoingCount: number;
  pendingCount: number;
  requests: Reservation[];
  reservedCount: number;
  rooms: Room[];
  setActiveTab: (tab: AdminTab) => void;
}

export default function AdminOverviewTab({
  allReservations,
  availableCount,
  buildingId,
  buildingName,
  computeEffectiveStatus,
  currentUserId,
  ongoingCount,
  pendingCount,
  requests,
  reservedCount,
  rooms,
  setActiveTab,
}: AdminOverviewTabProps) {
  const dashboardStats = [
    { label: 'Total Rooms', value: rooms.length, valueClass: 'text-black' },
    { label: 'Reserved', value: reservedCount, valueClass: 'ui-text-blue' },
    { label: 'Available', value: availableCount, valueClass: 'ui-text-green' },
    {
      label: 'Pending Requests',
      value: pendingCount,
      valueClass: 'ui-text-yellow',
      action: () => setActiveTab('pending'),
    },
    { label: 'Occupied', value: ongoingCount, valueClass: 'ui-text-orange' },
  ];

  const dashboardRoomRows = rooms
    .map((room) => ({
      room,
      effective: computeEffectiveStatus(room),
      floorLabel: getFloorDisplayLabel(room.floor, {
        id: buildingId,
        name: buildingName,
      }),
    }))
    .sort(
      (left, right) =>
        left.floorLabel.localeCompare(right.floorLabel) ||
        left.room.name.localeCompare(right.room.name, undefined, { numeric: true })
    );

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-2">
        {dashboardStats.map((stat) => {
          const content = (
            <>
              <p className="truncate text-[11px] font-bold text-black/65">{stat.label}</p>
              <p className={`mt-0.5 text-xl font-bold leading-none ${stat.valueClass}`}>
                {stat.value}
              </p>
            </>
          );

          return stat.action ? (
            <button
              key={stat.label}
              type="button"
              onClick={stat.action}
              className="glass-card p-2 text-left transition-all hover:!border-yellow-500/40"
            >
              {content}
            </button>
          ) : (
            <div key={stat.label} className="glass-card p-2">
              {content}
            </div>
          );
        })}
      </div>

      <div className="grid gap-2 lg:grid-cols-[1.15fr_1fr_0.9fr]">
        <section className="glass-card p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-black">Live Room Status</h3>
            <span className="text-[11px] font-bold text-black/55">{rooms.length} rooms</span>
          </div>

          {dashboardRoomRows.length === 0 ? (
            <p className="rounded-lg border border-dark/10 bg-dark/5 px-2 py-3 text-center text-xs text-black">
              No rooms configured yet.
            </p>
          ) : (
            <div className="space-y-1">
              {dashboardRoomRows.slice(0, 10).map(({ room, effective, floorLabel }) => (
                <div
                  key={room.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-dark/10 bg-white/70 px-2 py-1.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-black">{room.name}</p>
                    <p className="truncate text-[10px] text-black/60">
                      {floorLabel} | Cap {room.capacity}
                    </p>
                  </div>
                  <StatusBadge status={effective.status} />
                </div>
              ))}

              {dashboardRoomRows.length > 10 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('manage-rooms')}
                  className="w-full rounded-lg px-2 py-1 text-center text-[11px] font-bold text-primary hover:bg-primary/5"
                >
                  +{dashboardRoomRows.length - 10} more rooms
                </button>
              ) : null}
            </div>
          )}
        </section>

        <section className="glass-card p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-black">Pending Requests</h3>
            {requests.length > 0 ? (
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className="text-[11px] font-bold text-primary hover:text-primary-hover"
              >
                View all
              </button>
            ) : null}
          </div>

          {requests.length === 0 ? (
            <p className="rounded-lg border border-dark/10 bg-dark/5 px-2 py-3 text-center text-xs text-black">
              No requests waiting for approval.
            </p>
          ) : (
            <div className="space-y-1">
              {requests.slice(0, 7).map((request) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => setActiveTab('pending')}
                  className="w-full rounded-lg border border-dark/10 bg-white/70 px-2 py-1.5 text-left transition-all hover:border-yellow-500/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-bold text-black">{request.userName}</p>
                    <RoleBadge role={request.userRole} />
                  </div>
                  <p className="mt-0.5 truncate text-[10px] text-black/60">
                    {request.roomName} | {formatReservationDates(request.dates, request.date)} |{' '}
                    {formatTimeRange(request.startTime, request.endTime)}
                  </p>
                </button>
              ))}
              {requests.length > 7 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('pending')}
                  className="w-full rounded-lg px-2 py-1 text-center text-[11px] font-bold text-primary hover:bg-primary/5"
                >
                  +{requests.length - 7} more pending
                </button>
              ) : null}
            </div>
          )}
        </section>

        <BleSummaryCard
          buildingName={buildingName}
          detailsHref="/admin/ble-status"
          variant="compact"
        />
      </div>

      <MyReservationTimetable
        compact
        currentUserId={currentUserId}
        reservations={allReservations}
      />
    </div>
  );
}
