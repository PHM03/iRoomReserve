'use client';

import { useMemo, useState } from 'react';
import type { RoomHistoryEntry } from '@/lib/rooms/roomHistory';
import { formatDate, formatTimeRange } from '@/lib/utils/dateTime';
import { RoleBadge, StatusBadge } from './shared';

interface AdminRoomHistoryTabProps {
  roomHistory: RoomHistoryEntry[];
}

export default function AdminRoomHistoryTab({
  roomHistory,
}: AdminRoomHistoryTabProps) {
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historySearch, setHistorySearch] = useState('');

  const filteredHistory = useMemo(
    () =>
      roomHistory.filter((entry) => {
        if (historyFilter !== 'all' && entry.status !== historyFilter) {
          return false;
        }

        if (
          historySearch &&
          !entry.userName.toLowerCase().includes(historySearch.toLowerCase()) &&
          !entry.roomName.toLowerCase().includes(historySearch.toLowerCase())
        ) {
          return false;
        }

        return true;
      }),
    [historyFilter, historySearch, roomHistory]
  );

  return (
    <div>
      <div className="bg-white rounded-xl px-6 py-4 border border-white/30 inline-block mb-6">
        <h3 className="text-xl font-bold text-gray-800">Room History</h3>
      </div>

      <div className="glass-card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
              placeholder="Search by name or room..."
              className="glass-input w-full px-4 py-2.5 text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            {['all', 'approved', 'rejected', 'active', 'completed', 'cancelled'].map((filter) => (
              <button
                key={filter}
                onClick={() => setHistoryFilter(filter)}
                className={`px-3 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                  historyFilter === filter
                    ? 'bg-primary text-white border border-primary'
                    : 'bg-white text-gray-700 border border-gray-200 hover:text-primary'
                }`}
              >
                {filter === 'all' ? 'All Status' : filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-3">History</div>
          <h4 className="text-lg font-bold text-black mb-1">No Reservations Found</h4>
          <p className="text-sm text-black">
            {historySearch || historyFilter !== 'all'
              ? 'Try adjusting your filters.'
              : 'Reservation history will appear here.'}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block glass-card overflow-hidden !rounded-xl">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-dark/10">
                  <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((reservation) => (
                  <tr
                    key={reservation.id}
                    className="border-b border-dark/5 hover:bg-primary/10 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-black">{reservation.userName}</span>
                        <RoleBadge role={reservation.userRole} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {reservation.roomName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          reservation.type === 'reservation' ? 'ui-badge-blue' : 'ui-badge-purple'
                        }`}
                      >
                        {reservation.type === 'reservation' ? 'Reservation' : 'Class'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {formatDate(reservation.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {formatTimeRange(reservation.startTime, reservation.endTime)}
                    </td>
                    <td className="px-6 py-4 text-sm text-black max-w-[200px] truncate">
                      {reservation.purpose}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={reservation.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {filteredHistory.map((reservation) => (
              <div key={reservation.id} className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-black text-sm">{reservation.userName}</span>
                    <RoleBadge role={reservation.userRole} />
                  </div>
                  <StatusBadge status={reservation.status} />
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-black">Room:</span>
                    <span className="font-bold text-black">{reservation.roomName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Type:</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        reservation.type === 'reservation' ? 'ui-badge-blue' : 'ui-badge-purple'
                      }`}
                    >
                      {reservation.type === 'reservation' ? 'Reservation' : 'Class'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Date:</span>
                    <span className="text-black">{formatDate(reservation.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Time:</span>
                    <span className="text-black">
                      {formatTimeRange(reservation.startTime, reservation.endTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Purpose:</span>
                    <span className="text-black truncate max-w-[180px]">
                      {reservation.purpose}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-4 text-center">
        <p className="text-xs text-black">
          Showing {filteredHistory.length} of {roomHistory.length} entries
        </p>
      </div>
    </div>
  );
}
