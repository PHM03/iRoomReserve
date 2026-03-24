'use client';

import React from 'react';

export type StatusBadgeValue =
  | 'Available'
  | 'Reserved'
  | 'Ongoing'
  | 'Unavailable'
  | 'Occupied'
  | 'Vacant'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled'
  | 'open'
  | 'responded'
  | 'closed'
  | string;

interface StatusBadgeProps {
  status: StatusBadgeValue;
  className?: string;
}

function getBadgeStyle(status: string): string {
  switch (status) {
    case 'Available':
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    case 'Reserved':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'Ongoing':
    case 'Occupied':
      return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'Unavailable':
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'approved':
    case 'responded':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'pending':
    case 'open':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'completed':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'rejected':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'cancelled':
    case 'closed':
    case 'Vacant':
      return 'bg-white/10 text-white/50 border-white/20';
    default:
      return 'bg-white/10 text-white/50 border-white/20';
  }
}

function getBadgeLabel(status: string): string {
  switch (status) {
    case 'Occupied':
      return 'Ongoing';
    case 'Vacant':
      return 'Available';
    default:
      return status === status.toLowerCase()
        ? status.charAt(0).toUpperCase() + status.slice(1)
        : status;
  }
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getBadgeStyle(status)} ${className}`.trim()}
    >
      {getBadgeLabel(status)}
    </span>
  );
};

export default StatusBadge;
