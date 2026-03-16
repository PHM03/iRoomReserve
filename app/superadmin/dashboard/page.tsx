'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  onUsersByStatus,
  approveUser,
  approveAdmin,
  rejectUser,
  ManagedUser,
} from '@/lib/auth';
import {
  getBuildingByAdmin,
  unassignAdminFromBuilding,
  Building,
} from '@/lib/buildings';
import { seedBuildings } from '@/lib/seedBuildings';

type Tab = 'pending' | 'approved' | 'rejected' | 'admins';

export default function SuperAdminDashboard() {
  const { firebaseUser, profile, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [pendingUsers, setPendingUsers] = useState<ManagedUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ManagedUser[]>([]);
  const [rejectedUsers, setRejectedUsers] = useState<ManagedUser[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ─── Approval Modal State ─────────────────────────────────────
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [availableBuildings, setAvailableBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Redirect if not super admin
  useEffect(() => {
    if (!loading && (!firebaseUser || profile?.role !== 'Super Admin')) {
      router.push('/');
    }
  }, [loading, firebaseUser, profile, router]);

  // Auto-seed buildings on first load
  const seeded = useRef(false);
  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      seedBuildings().catch(console.warn);
    }
  }, []);

  // Real-time listeners
  useEffect(() => {
    const unsubPending = onUsersByStatus('pending', setPendingUsers);
    const unsubApproved = onUsersByStatus('approved', setApprovedUsers);
    const unsubRejected = onUsersByStatus('rejected', setRejectedUsers);
    return () => { unsubPending(); unsubApproved(); unsubRejected(); };
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────
  const openApprovalModal = async (user: ManagedUser) => {
    setSelectedUser(user);
    setSelectedBuildingId('');
    setShowApprovalModal(true);
    // Fetch all buildings (multiple admins per building allowed)
    try {
      const { getBuildings } = await import('@/lib/buildings');
      const buildings = await getBuildings();
      setAvailableBuildings(buildings);
    } catch (err) {
      console.warn('Failed to fetch buildings:', err);
      setAvailableBuildings([]);
    }
  };

  const handleApproveWithBuilding = async () => {
    if (!selectedUser || !selectedBuildingId) return;
    setModalLoading(true);
    try {
      const building = availableBuildings.find((b) => b.id === selectedBuildingId);
      if (!building) return;
      await approveAdmin(selectedUser.uid, building.id, building.name);
    } catch (err) {
      console.error('Failed to approve admin:', err);
    }
    setModalLoading(false);
    setShowApprovalModal(false);
    setSelectedUser(null);
  };

  const handleApprove = async (uid: string) => {
    setActionLoading(uid);
    try { await approveUser(uid); } catch (err) { console.error('Failed to approve:', err); }
    setActionLoading(null);
  };

  const handleReject = async (uid: string) => {
    setActionLoading(uid);
    try { await rejectUser(uid); } catch (err) { console.error('Failed to reject:', err); }
    setActionLoading(null);
  };

  const handleRevokeAdmin = async (user: ManagedUser) => {
    setActionLoading(user.uid);
    try {
      // Find and unassign their building first
      const building = await getBuildingByAdmin(user.uid);
      if (building) {
        await unassignAdminFromBuilding(building.id);
      }
      await rejectUser(user.uid);
    } catch (err) {
      console.error('Failed to revoke admin:', err);
    }
    setActionLoading(null);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (loading || !firebaseUser || profile?.role !== 'Super Admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-white/50">Loading...</p>
        </div>
      </div>
    );
  }

  // ─── Admins Tab Data ──────────────────────────────────────────
  const approvedAdmins = approvedUsers.filter((u) => u.role === 'Administrator' || u.role === 'Utility Staff');

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'pending', label: 'Pending', count: pendingUsers.length },
    { key: 'approved', label: 'Approved', count: approvedUsers.length },
    { key: 'rejected', label: 'Rejected', count: rejectedUsers.length },
    { key: 'admins', label: 'Staff & Admins', count: approvedAdmins.length },
  ];

  const currentUsers =
    activeTab === 'pending' ? pendingUsers
    : activeTab === 'approved' ? approvedUsers
    : activeTab === 'rejected' ? rejectedUsers
    : approvedAdmins;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Faculty': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Utility Staff': return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'Administrator': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-white/10 text-white/50 border-white/20';
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Decorative background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-20 -left-40 w-96 h-96 rounded-full bg-secondary/8 blur-3xl" />
      </div>

      {/* Top Nav */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">iRoomReserve</h1>
                <p className="text-[10px] text-white/40 -mt-0.5 font-bold">Super Admin Dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-sm font-bold">
                  SA
                </div>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Super Admin
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-white/40 hover:text-primary hover:bg-white/5 transition-all"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/40 font-bold">Pending</p>
                <p className="text-3xl font-bold text-yellow-400 mt-1">{pendingUsers.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/40 font-bold">Approved</p>
                <p className="text-3xl font-bold text-green-400 mt-1">{approvedUsers.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/40 font-bold">Rejected</p>
                <p className="text-3xl font-bold text-red-400 mt-1">{rejectedUsers.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/40 font-bold">Admins</p>
                <p className="text-3xl font-bold text-purple-400 mt-1">{approvedAdmins.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 glass-card !rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Admins Tab ────────────────────────────────────────── */}
        {activeTab === 'admins' ? (
          approvedAdmins.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <svg className="w-16 h-16 text-white/10 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-lg font-bold text-white/60 mb-1">No admins assigned yet</h3>
              <p className="text-sm text-white/30">Approve Administrator accounts and assign them to buildings.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {approvedAdmins.map((user) => (
                <div key={user.uid} className="glass-card p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold text-lg">
                        {user.firstName[0]?.toUpperCase() || '?'}{user.lastName[0]?.toUpperCase() || ''}
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{user.firstName} {user.lastName}</h3>
                        <p className="text-white/40 text-sm">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 sm:ml-auto">
                      {user.assignedBuilding ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-blue-500/20 text-blue-300 border-blue-500/30">
                          <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {user.assignedBuilding}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                          No building assigned
                        </span>
                      )}
                      <button
                        onClick={() => handleRevokeAdmin(user)}
                        disabled={actionLoading === user.uid}
                        className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-white/5 text-white/50 border border-white/10 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 transition-all disabled:opacity-50"
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* ─── Standard User List (Pending / Approved / Rejected) ─ */
          currentUsers.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <svg className="w-16 h-16 text-white/10 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-bold text-white/60 mb-1">No {activeTab} registrations</h3>
              <p className="text-sm text-white/30">
                {activeTab === 'pending' ? 'All caught up! No registrations waiting for approval.'
                  : activeTab === 'approved' ? 'No faculty or admin accounts have been approved yet.'
                  : 'No registrations have been rejected.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentUsers.map((user) => (
                <div key={user.uid} className="glass-card p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-bold text-lg">
                        {user.firstName[0]?.toUpperCase() || '?'}{user.lastName[0]?.toUpperCase() || ''}
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{user.firstName} {user.lastName}</h3>
                        <p className="text-white/40 text-sm">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 sm:ml-auto">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>

                      {/* Show building badge for approved admins */}
                      {activeTab === 'approved' && (user.role === 'Administrator' || user.role === 'Utility Staff') && user.assignedBuilding && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border bg-blue-500/20 text-blue-300 border-blue-500/30">
                          {user.assignedBuilding}
                        </span>
                      )}

                      {activeTab === 'pending' && (
                        <div className="flex space-x-2">
                          {(user.role === 'Administrator' || user.role === 'Utility Staff') ? (
                            <button
                              onClick={() => openApprovalModal(user)}
                              disabled={actionLoading === user.uid}
                              className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-all disabled:opacity-50"
                            >
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve & Assign
                            </button>
                          ) : (
                            <button
                              onClick={() => handleApprove(user.uid)}
                              disabled={actionLoading === user.uid}
                              className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-all disabled:opacity-50"
                            >
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => handleReject(user.uid)}
                            disabled={actionLoading === user.uid}
                            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all disabled:opacity-50"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Decline
                          </button>
                        </div>
                      )}

                      {activeTab === 'approved' && (
                        <button
                          onClick={() => (user.role === 'Administrator' || user.role === 'Utility Staff') ? handleRevokeAdmin(user) : handleReject(user.uid)}
                          disabled={actionLoading === user.uid}
                          className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-white/5 text-white/50 border border-white/10 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 transition-all disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      )}

                      {activeTab === 'rejected' && (
                        <button
                          onClick={() => (user.role === 'Administrator' || user.role === 'Utility Staff') ? openApprovalModal(user) : handleApprove(user.uid)}
                          disabled={actionLoading === user.uid}
                          className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-white/5 text-white/50 border border-white/10 hover:bg-green-500/20 hover:text-green-300 hover:border-green-500/30 transition-all disabled:opacity-50"
                        >
                          Reinstate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* ─── Approval Modal ──────────────────────────────────────── */}
      {showApprovalModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !modalLoading && setShowApprovalModal(false)}
          />

          {/* Modal */}
          <div className="glass-card !bg-[#1a1a2e]/95 p-6 sm:p-8 w-full max-w-md relative z-10 !rounded-2xl border-primary/20">
            <h2 className="text-xl font-bold text-white mb-1">Approve & Assign Building</h2>
            <p className="text-sm text-white/40 mb-6">Assign a building for this person to manage.</p>

            {/* User Info */}
            <div className="flex items-center space-x-4 glass-card !bg-white/5 p-4 !rounded-xl mb-6">
              <div className="w-11 h-11 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {selectedUser.firstName[0]?.toUpperCase() || '?'}{selectedUser.lastName[0]?.toUpperCase() || ''}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-white text-sm">{selectedUser.firstName} {selectedUser.lastName}</h4>
                <p className="text-xs text-white/40 truncate">{selectedUser.email}</p>
              </div>
            </div>



            {/* Building Dropdown */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-white/70 mb-1.5">Assign Building</label>
              <select
                value={selectedBuildingId}
                onChange={(e) => setSelectedBuildingId(e.target.value)}
                className="glass-input w-full px-4 py-3 bg-white/6 appearance-none cursor-pointer"
                style={{ backgroundImage: 'none' }}
              >
                <option value="" disabled className="bg-[#1a1a2e] text-white/50">
                  Select a building...
                </option>
                {availableBuildings.map((b) => (
                  <option key={b.id} value={b.id} className="bg-[#1a1a2e] text-white">
                    {b.name} {b.code ? `(${b.code})` : ''}
                  </option>
                ))}
              </select>
              {availableBuildings.length === 0 && (
                <p className="text-xs text-yellow-400/70 mt-2">
                  ⚠ No buildings found. Please add buildings in Firestore first.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                disabled={modalLoading}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold border border-white/15 text-white/60 hover:bg-white/5 hover:text-white transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveWithBuilding}
                disabled={!selectedBuildingId || modalLoading}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-bold bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-all disabled:opacity-30 flex items-center justify-center"
              >
                {modalLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Assigning...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve & Assign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
