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
      return 'bg-green-100/90 text-green-800 border-green-300/80 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.08)]';
    case 'Reserved':
      return 'bg-blue-100/90 text-blue-800 border-blue-300/80 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.08)]';
    case 'Ongoing':
    case 'Occupied':
      return 'bg-orange-100/90 text-orange-800 border-orange-300/80 shadow-[inset_0_0_0_1px_rgba(249,115,22,0.08)]';
    case 'Unavailable':
      return 'bg-red-100/90 text-red-800 border-red-300/80 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.08)]';
    case 'approved':
    case 'responded':
      return 'bg-green-100/90 text-green-800 border-green-300/80 shadow-[inset_0_0_0_1px_rgba(34,197,94,0.08)]';
    case 'pending':
    case 'open':
      return 'bg-blue-100/90 text-blue-800 border-blue-300/80 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.08)]';
    case 'completed':
      return 'bg-yellow-100/90 text-yellow-800 border-yellow-300/80 shadow-[inset_0_0_0_1px_rgba(234,179,8,0.08)]';
    case 'rejected':
      return 'bg-red-100/90 text-red-800 border-red-300/80 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.08)]';
    case 'cancelled':
    case 'closed':
    case 'Vacant':
      return 'bg-[#f0f0f0] text-[#343434] border-[#d1d1d1]';
    default:
      return 'bg-[#f0f0f0] text-[#343434] border-[#d1d1d1]';
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
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border leading-5 ${getBadgeStyle(status)} ${className}`.trim()}
    >
      {getBadgeLabel(status)}
    </span>
  );
};

export default StatusBadge;
