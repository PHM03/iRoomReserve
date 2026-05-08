import BleSummaryCard from '@/components/ui/BleSummaryCard';
import MyReservationTimetable from '@/components/rooms/schedules/MyReservationTimetable';
import type { AdminTab } from '@/components/layout/NavBar';
import type { Reservation } from '@/lib/reservations/reservations';
import type { Room } from '@/lib/rooms/rooms';
import { formatTimeRange } from '@/lib/utils/dateTime';
import { formatReservationDates, RoleBadge, StatusBadge } from './shared';

interface AdminOverviewTabProps {
  allReservations: Reservation[];
  availableCount: number;
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
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="glass-card p-4">
          <p className="text-xs text-black font-bold">Total Rooms</p>
          <p className="text-2xl font-bold text-black mt-1">{rooms.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-black font-bold">Reserved</p>
          <p className="text-2xl font-bold ui-text-blue mt-1">{reservedCount}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-black font-bold">Available</p>
          <p className="text-2xl font-bold ui-text-green mt-1">{availableCount}</p>
        </div>
        <button
          onClick={() => setActiveTab('pending')}
          className="glass-card p-4 text-left hover:!border-yellow-500/40 transition-all cursor-pointer"
        >
          <p className="text-xs text-black font-bold">Pending Requests</p>
          <p className="text-2xl font-bold ui-text-yellow mt-1">{pendingCount}</p>
          <p className="text-[10px] text-black mt-0.5">Click to review →</p>
        </button>
        <div className="glass-card p-4">
          <p className="text-xs text-black font-bold">Occupied</p>
          <p className="text-2xl font-bold ui-text-orange mt-1">{ongoingCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl px-6 py-4 border border-white/30 inline-block mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          Live Room Status <span className="text-sm text-gray-600 font-normal ml-2">({buildingName})</span>
        </h3>
      </div>
      {rooms.length === 0 ? (
        <div className="glass-card p-8 text-center mb-8">
          <p className="text-sm text-black">No rooms configured yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {rooms.map((room) => {
            const effective = computeEffectiveStatus(room);
            const borderColor =
              effective.status === 'Occupied'
                ? 'border-orange-500/40'
                : effective.status === 'Reserved'
                  ? 'border-blue-500/40'
                  : effective.status === 'Unavailable'
                    ? 'border-red-500/40'
                    : 'border-green-500/40';

            return (
              <div key={room.id} className={`glass-card p-4 border-l-4 ${borderColor}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-black">{room.name}</h4>
                    <p className="text-xs text-black">
                      {room.floor} · Cap: {room.capacity}
                    </p>
                  </div>
                  <StatusBadge status={effective.status} />
                </div>
                {effective.detail && <p className="text-xs text-black mt-2">{effective.detail}</p>}
              </div>
            );
          })}
        </div>
      )}

      <BleSummaryCard
        buildingName={buildingName}
        className="mb-8"
        detailsHref="/admin/ble-status"
      />

      <MyReservationTimetable
        className="mb-8"
        currentUserId={currentUserId}
        reservations={allReservations}
      />

      <div className="flex items-center justify-between mb-4 bg-white rounded-xl px-6 py-4 border border-white/30">
        <h3 className="text-lg font-bold text-gray-800">Pending Requests</h3>
        {requests.length > 0 && (
          <button
            onClick={() => setActiveTab('pending')}
            className="text-sm text-primary font-bold hover:text-primary-hover transition-colors"
          >
            View all ({requests.length}) →
          </button>
        )}
      </div>
      {requests.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-sm text-black">No requests waiting for approval.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.slice(0, 3).map((request) => (
            <button
              key={request.id}
              onClick={() => setActiveTab('pending')}
              className="glass-card p-4 w-full text-left hover:!border-yellow-500/30 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center ui-text-yellow font-bold text-sm shrink-0">
                  {request.userName
                    .split(' ')
                    .map((name) => name[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-black text-sm">{request.userName}</h4>
                    <RoleBadge role={request.userRole} />
                  </div>
                  <p className="text-xs text-black mt-0.5">
                    {request.roomName} | {formatReservationDates(request.dates, request.date)} |{' '}
                    {formatTimeRange(request.startTime, request.endTime)}
                  </p>
                </div>
                <svg className="w-5 h-5 text-black shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
          {requests.length > 3 && (
            <button
              onClick={() => setActiveTab('pending')}
              className="w-full text-center py-2 text-sm font-bold text-primary/70 hover:text-primary transition-colors"
            >
              +{requests.length - 3} more pending...
            </button>
          )}
        </div>
      )}
    </div>
  );
}
