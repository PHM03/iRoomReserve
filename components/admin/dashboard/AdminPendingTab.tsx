'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import {
  approveReservation,
  rejectReservation,
  type Reservation,
} from '@/lib/reservations/reservations';
import { formatTimeRange } from '@/lib/utils/dateTime';
import { formatReservationDates, RoleBadge, getManagedBuildingOptionLabel } from './shared';

interface BuildingOption {
  id: string;
  name: string;
}

interface AdminPendingTabProps {
  activeBuildingLabel: string;
  approverEmail?: string | null;
  buildingId: string;
  requests: Reservation[];
  managedBuildings: BuildingOption[];
  onBuildingChange: (buildingId: string) => void;
  onReload: () => Promise<void>;
}

function ChevronDownIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function CheckIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

export default function AdminPendingTab({
  activeBuildingLabel,
  approverEmail,
  buildingId,
  requests,
  managedBuildings,
  onBuildingChange,
  onReload,
}: AdminPendingTabProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingReservationId, setRejectingReservationId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [reservationActionError, setReservationActionError] = useState('');
  const [isBuildingSwitcherOpen, setIsBuildingSwitcherOpen] = useState(false);
  const buildingSwitcherRef = useRef<HTMLDivElement | null>(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ type: 'approve' | 'reject'; id: string } | null>(null);
  const [userTypeFilter, setUserTypeFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const isAnyFilterActive =
    userTypeFilter.length > 0 || dateFrom !== '' || dateTo !== '' || roomFilter !== '' || statusFilter !== '';

  const uniqueRooms = useMemo(() => {
    const seen = new Set<string>();
    return requests
      .map((r) => r.roomName)
      .filter((name) => { if (seen.has(name)) return false; seen.add(name); return true; })
      .sort();
  }, [requests]);

  const clearFilters = () => {
    setUserTypeFilter([]);
    setDateFrom('');
    setDateTo('');
    setRoomFilter('');
    setStatusFilter('');
  };

  const toggleUserType = (type: string) => {
    setUserTypeFilter((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const openConfirm = (type: 'approve' | 'reject', id: string) => {
    setReservationActionError('');
    if (type === 'reject') {
      setRejectingReservationId(id);
      setRejectReason('');
    }
    setConfirmModal({
      type,
      id
    });
  };

  const closeConfirm = () => {
    setConfirmModal(null);
    setRejectingReservationId(null);
    setRejectReason('');
  };

  const handleApprove = async (id: string) => {
    if (!approverEmail) return;
    setReservationActionError('');
    setActionLoading(id);
    try {
      await approveReservation(id, approverEmail);
      await onReload();
    } catch (error) {
      console.warn('Failed to approve:', error);
      setReservationActionError(
        error instanceof Error ? error.message : 'Failed to approve reservation.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!approverEmail) return;
    if (!rejectReason.trim()) {
      setReservationActionError('Please enter a reason before rejecting this reservation.');
      return;
    }
    setReservationActionError('');
    setActionLoading(id);
    try {
      await rejectReservation(id, approverEmail, rejectReason.trim());
      setRejectingReservationId(null);
      setRejectReason('');
      await onReload();
    } catch (error) {
      console.warn('Failed to reject:', error);
      setReservationActionError(
        error instanceof Error ? error.message : 'Failed to reject reservation.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!buildingSwitcherRef.current?.contains(event.target as Node)) {
        setIsBuildingSwitcherOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsBuildingSwitcherOpen(false);
    };
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleBuildingSwitcherSelect = (nextBuildingId: string) => {
    onBuildingChange(nextBuildingId);
    setIsBuildingSwitcherOpen(false);
  };

  // ─── Filtered list ────────────────────────────────────────────────────────
  const q = searchQuery.trim().toLowerCase();
  const filteredRequests = requests.filter((r) => {
    if (q && !(
      r.userName.toLowerCase().includes(q) ||
      r.roomName.toLowerCase().includes(q) ||
      (r.purpose ?? '').toLowerCase().includes(q)
    )) return false;

    if (userTypeFilter.length > 0) {
      const role = (r.userRole ?? '').toLowerCase();
      if (!userTypeFilter.some((t) => role.includes(t.toLowerCase()))) return false;
    }

    const rDate = r.dates?.[0] ?? r.date;
    if (dateFrom && rDate < dateFrom) return false;
    if (dateTo && rDate > dateTo) return false;
    if (roomFilter && r.roomName !== roomFilter) return false;
    if (statusFilter && statusFilter !== 'all' && r.status !== statusFilter) return false;

    return true;
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const avatarColor = (name: string) => {
    const colors = ['#8B0000', '#1a6b3a', '#1a3a6b', '#6b1a6b', '#6b4e1a', '#1a5c6b'];
    let h = 0;
    for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
    return colors[h];
  };

  const statusBadge = (status: string) => {
    if (status === 'approved') return {
      bg: '#d1fae5',
      color: '#065f46',
      border: '#6ee7b7',
      label: 'Approved'
    };
    if (status === 'rejected') return {
      bg: '#fee2e2',
      color: '#991b1b',
      border: '#fca5a5',
      label: 'Rejected'
    };
    return {
      bg: '#fef9c3',
      color: '#92400e',
      border: '#fde68a',
      label: 'Pending'
    };
  };

  return (
    <div>
      {/* ── Header with building switcher ────────────────────────────────── */}
      <div
        className="mb-6 w-full"
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          padding: '20px 24px',
        }}
      >
        <div className="flex items-start gap-3 flex-wrap">
          <h3 className="text-xl font-bold text-gray-900">Pending Reservations</h3>
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
            style={{
              background: '#fef9c3',
              color: '#92400e',
              border: '1px solid #fde68a'
            }}
          >
            {requests.length} pending
          </span>
        </div>
        <div className="mt-2" ref={buildingSwitcherRef} style={{
          position: 'relative',
          width: 'fit-content'
        }}>
          <button
            type="button"
            onClick={() => setIsBuildingSwitcherOpen((prev) => !prev)}
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#a12124]/30 bg-[#a12124]/10 px-3 py-1 text-xs font-bold text-[#7f1d1d] shadow-sm transition-all hover:border-[#a12124]/45 hover:bg-[#a12124]/15 hover:shadow focus:outline-none focus:ring-2 focus:ring-[#a12124]/25"
            aria-haspopup="menu"
            aria-expanded={isBuildingSwitcherOpen}
          >
            <span>Active Building: {activeBuildingLabel}</span>
            <ChevronDownIcon
              className={`h-3.5 w-3.5 transition-transform ${isBuildingSwitcherOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isBuildingSwitcherOpen && (
            <div
              className="absolute left-0 z-20 mt-2 min-w-44 overflow-hidden rounded-xl border border-[#a12124]/15 bg-white py-1 shadow-lg"
              role="menu"
            >
              {managedBuildings.map((building) => {
                const isActive = building.id === buildingId;
                return (
                  <button
                    key={building.id}
                    type="button"
                    onClick={() => handleBuildingSwitcherSelect(building.id)}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs font-bold transition-colors ${isActive
                        ? 'bg-[#a12124]/10 text-[#7f1d1d]'
                        : 'text-gray-700 hover:bg-[#a12124]/5 hover:text-[#a12124]'
                      }`}
                    role="menuitemradio"
                    aria-checked={isActive}
                  >
                    <span>{getManagedBuildingOptionLabel(building)}</span>
                    {isActive && <CheckIcon className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Search bar ───────────────────────────────────────────────────── */}
      <div
        className="mb-5 w-full"
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          padding: '12px 20px',
        }}
      >
        <div className="flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="pending-reservations-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, room, or purpose..."
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none border-none"
            style={{
              border: 'none',
              outline: 'none'
            }}
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Clear search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div
        className="mb-5 w-full"
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          padding: '14px 20px',
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>

          {/* User Type */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 shrink-0">Type</span>
            {(['Student', 'Faculty'] as const).map((type) => {
              const active = userTypeFilter.includes(type);
              return (
                <button key={type} type="button" onClick={() => toggleUserType(type)} style={{
                  borderRadius: '20px',
                  padding: '6px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: active ? '1.5px solid #8B0000' : '1.5px solid #e0e0e0',
                  background: active ? '#8B0000' : '#f5f5f5',
                  color: active ? '#ffffff' : '#666666',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  lineHeight: 1
                }}>
                  {type}
                </button>
              );
            })}
          </div>

          <div style={{
            width: '1px',
            height: '24px',
            background: '#e8e8e8',
            flexShrink: 0
          }} />

          {/* Date range */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 shrink-0">Date</span>
            <input id="filter-date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-sm text-gray-700" style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '6px 12px',
              outline: 'none',
              background: '#fff',
              color: dateFrom ? '#222' : '#aaa'
            }} title="From date" aria-label="From date" />
            <span className="text-xs text-gray-400">—</span>
            <input id="filter-date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-sm text-gray-700" style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              padding: '6px 12px',
              outline: 'none',
              background: '#fff',
              color: dateTo ? '#222' : '#aaa'
            }} title="To date" aria-label="To date" />
          </div>

          <div style={{
            width: '1px',
            height: '24px',
            background: '#e8e8e8',
            flexShrink: 0
          }} />

          {/* Room */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 shrink-0">Room</span>
            <select id="filter-room" value={roomFilter} onChange={(e) => setRoomFilter(e.target.value)} className="glass-input text-sm" style={{
              padding: '6px 12px',
              minWidth: '140px'
            }}>
              <option value="">Select Room</option>
              {uniqueRooms.map((room) => <option key={room} value={room}>{room}</option>)}
            </select>
          </div>

          <div style={{
            width: '1px',
            height: '24px',
            background: '#e8e8e8',
            flexShrink: 0
          }} />

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 shrink-0">Status</span>
            <select id="filter-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="glass-input text-sm" style={{
              padding: '6px 12px',
              minWidth: '130px'
            }}>
              <option value="">Select Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All</option>
            </select>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            style={{
              marginLeft: 'auto',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              border: isAnyFilterActive ? '1.5px solid #8B0000' : '1.5px solid #d1d5db',
              background: 'transparent',
              color: isAnyFilterActive ? '#8B0000' : '#9ca3af',
              cursor: isAnyFilterActive ? 'pointer' : 'default',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap'
            }}
            aria-label="Clear all filters"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* ── Empty states ─────────────────────────────────────────────────── */}
      {requests.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          padding: '48px 24px',
          textAlign: 'center'
        }}>
          <svg width="48" height="48" fill="none" stroke="#ccc" viewBox="0 0 24 24" style={{ margin: '0 auto 12px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          <p style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#444'
          }}>All caught up!</p>
          <p style={{
            fontSize: '12px',
            color: '#999',
            marginTop: '4px'
          }}>No pending reservation requests</p>
        </div>
      ) : filteredRequests.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            padding: '56px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cccccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
          </svg>
            <p style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#555555',
              marginBottom: '6px'
            }}>No reservations found</p>
            <p style={{
              fontSize: '13px',
              color: '#999999',
              marginBottom: isAnyFilterActive ? '20px' : '0'
            }}>Try adjusting your search or filters</p>
          {isAnyFilterActive && (
              <button type="button" onClick={clearFilters} style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: '1.5px solid #8B0000',
                background: 'transparent',
                color: '#8B0000',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff5f5'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <style>{`@keyframes fadeInCard{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>

          {/* ── Confirm modal ──────────────────────────────────────────── */}
          {confirmModal && (
            <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    background: 'rgba(0,0,0,0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px'
                  }}
              onClick={(e) => { if (e.target === e.currentTarget) closeConfirm(); }}
            >
                  <div style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '28px 32px',
                    maxWidth: '440px',
                    width: '100%',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
                  }}>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#111',
                      marginBottom: '8px'
                    }}>
                  {confirmModal.type === 'approve' ? 'Approve Reservation?' : 'Reject Reservation?'}
                </h4>
                    <p style={{
                      fontSize: '13px',
                      color: '#666',
                      marginBottom: confirmModal.type === 'reject' ? '16px' : '24px'
                    }}>
                  {confirmModal.type === 'approve'
                    ? 'This will approve the reservation and notify the requester.'
                    : 'Please provide a reason for rejecting this reservation.'}
                </p>
                {confirmModal.type === 'reject' && (
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#555',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          display: 'block',
                          marginBottom: '6px'
                        }}>Reason for rejection</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Explain why this request is being rejected…"
                          style={{
                            width: '100%',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            fontSize: '13px',
                            minHeight: '90px',
                            resize: 'vertical',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                    />
                        {reservationActionError && <p style={{
                          fontSize: '12px',
                          color: '#e53935',
                          marginTop: '4px'
                        }}>{reservationActionError}</p>}
                  </div>
                )}
                    <div style={{
                      display: 'flex',
                      gap: '10px',
                      justifyContent: 'flex-end'
                    }}>
                      <button onClick={closeConfirm} style={{
                        padding: '8px 18px',
                        borderRadius: '8px',
                        border: '1px solid #e0e0e0',
                        background: 'transparent',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#555',
                        cursor: 'pointer'
                      }}>Cancel</button>
                  <button
                    disabled={actionLoading === confirmModal.id || (confirmModal.type === 'reject' && !rejectReason.trim())}
                    onClick={async () => {
                      if (confirmModal.type === 'approve') {
                        await handleApprove(confirmModal.id);
                      } else {
                        await handleReject(confirmModal.id);
                      }
                      if (!reservationActionError) closeConfirm();
                    }}
                        style={{
                          padding: '8px 20px',
                          borderRadius: '8px',
                          border: 'none',
                          background: confirmModal.type === 'approve' ? '#8B0000' : '#e53935',
                          color: '#fff',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          opacity: actionLoading === confirmModal.id ? 0.6 : 1
                        }}
                  >
                    {actionLoading === confirmModal.id ? 'Processing…' : confirmModal.type === 'approve' ? 'Yes, Approve' : 'Yes, Reject'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Cards list ─────────────────────────────────────────────── */}
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 24px',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#111'
                  }}>Pending Reservations</span>
                  <span style={{
                    fontSize: '13px',
                    color: '#999'
                  }}>Showing {filteredRequests.length} result{filteredRequests.length !== 1 ? 's' : ''}</span>
            </div>
                <div style={{
                  padding: '16px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
              {reservationActionError && !confirmModal && (
                    <p style={{
                      fontSize: '12px',
                      color: '#e53935',
                      fontWeight: 600
                    }}>{reservationActionError}</p>
              )}
              {filteredRequests.map((request) => {
                const badge = statusBadge(request.status);
                const initials = request.userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                const avatarBg = avatarColor(request.userName);
                return (
                  <div
                    key={request.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #f0f0f0',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      padding: '20px 24px',
                      transition: 'box-shadow 0.2s',
                      animation: 'fadeInCard 0.25s ease both'
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
                  >
                    {/* Top row */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '16px',
                      gap: '12px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: avatarBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '14px',
                          flexShrink: 0
                        }}>{initials}</div>
                        <div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{
                              fontSize: '15px',
                              fontWeight: 600,
                              color: '#111'
                            }}>{request.userName}</span>
                            <RoleBadge role={request.userRole} />
                          </div>
                          <p style={{
                            fontSize: '12px',
                            color: '#999',
                            marginTop: '2px'
                          }}>Reservation Request</p>
                        </div>
                      </div>
                      <span style={{
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`
                      }}>{badge.label}</span>
                    </div>

                    {/* Info grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px',
                      marginBottom: '12px'
                    }}>
                      {[
                        {
                          label: 'ROOM',
                          main: request.roomName,
                          sub: request.buildingName
                        },
                        {
                          label: 'DATE',
                          main: formatReservationDates(request.dates, request.date)
                        },
                        {
                          label: 'TIME',
                          main: formatTimeRange(request.startTime, request.endTime)
                        },
                        {
                          label: 'PURPOSE',
                          main: request.purpose || 'Not specified'
                        },
                      ].map(({ label, main, sub }) => (
                        <div key={label} style={{
                          background: '#fafafa',
                          borderRadius: '8px',
                          border: '1px solid #f0f0f0',
                          padding: '10px 14px'
                        }}>
                          <p style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            letterSpacing: '0.08em',
                            color: '#999',
                            textTransform: 'uppercase',
                            marginBottom: '4px'
                          }}>{label}</p>
                          <p style={{
                            fontSize: '14px',
                            color: '#222',
                            fontWeight: 500,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                          }}>{main}</p>
                          {sub && <p style={{
                            fontSize: '12px',
                            color: '#888',
                            marginTop: '2px'
                          }}>{sub}</p>}
                        </div>
                      ))}
                    </div>

                    {/* Equipment */}
                    {request.equipment && Object.keys(request.equipment).length > 0 && (
                      <div style={{
                        background: '#fafafa',
                        borderRadius: '8px',
                        border: '1px solid #f0f0f0',
                        padding: '10px 14px',
                        marginBottom: '12px'
                      }}>
                        <p style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          color: '#999',
                          textTransform: 'uppercase',
                          marginBottom: '8px'
                        }}>Equipment</p>
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px'
                        }}>
                          {Object.entries(request.equipment).map(([key, val]) => (
                            <span key={key} style={{
                              background: '#f0f0f0',
                              borderRadius: '20px',
                              padding: '2px 10px',
                              fontSize: '12px',
                              color: '#444',
                              fontWeight: 500
                            }}>{key} x{val}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Concept paper */}
                    {request.approvalDocumentUrl && (
                      <div style={{
                        background: '#fafafa',
                        borderRadius: '8px',
                        border: '1px solid #f0f0f0',
                        padding: '10px 14px',
                        marginBottom: '12px'
                      }}>
                        <p style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          color: '#999',
                          textTransform: 'uppercase',
                          marginBottom: '6px'
                        }}>Concept Paper / Letter of Approval</p>
                        <a href={request.approvalDocumentUrl} target="_blank" rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '13px',
                            color: '#8B0000',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none'; }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" /></svg>
                          {request.approvalDocumentName || 'Open attachment'}
                        </a>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '10px',
                      paddingTop: '14px',
                      borderTop: '1px solid #f0f0f0'
                    }}>
                      <button
                        onClick={() => openConfirm('approve', request.id)}
                        disabled={actionLoading === request.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 20px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#8B0000',
                          color: '#fff',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          opacity: actionLoading === request.id ? 0.6 : 1,
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => { if (!actionLoading) (e.currentTarget as HTMLButtonElement).style.background = '#6e0000'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#8B0000'; }}
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                        Approve
                      </button>
                      <button
                        onClick={() => openConfirm('reject', request.id)}
                        disabled={actionLoading === request.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 20px',
                          borderRadius: '8px',
                          border: '1px solid #e53935',
                          background: 'transparent',
                          color: '#e53935',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          opacity: actionLoading === request.id ? 0.6 : 1,
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => { if (!actionLoading) (e.currentTarget as HTMLButtonElement).style.background = '#fff0f0'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}