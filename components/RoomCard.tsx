'use client';

import React from 'react';
import StatusBadge from './StatusBadge';
import type { RoomStatusValue } from '@/lib/roomStatus';

interface RoomCardProps {
  name: string;
  floor: string;
  status: RoomStatusValue;
}

const RoomCard: React.FC<RoomCardProps> = ({ name, floor, status }) => {
  const isAvailable = status === 'Available';

  return (
    <div className="glass-card p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-black">{name}</h3>
          <p className="text-sm text-black">{floor}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <button
        disabled={!isAvailable}
        className={`w-full py-2.5 px-4 rounded-xl font-bold transition-all ${
          isAvailable
            ? 'btn-primary'
            : 'bg-dark/5 text-black cursor-not-allowed border border-dark/10'
        }`}
      >
        Reserve
      </button>
    </div>
  );
};

export default RoomCard;
