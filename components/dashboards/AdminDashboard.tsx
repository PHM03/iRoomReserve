'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AdminTab } from '@/components/layout/NavBar';
import AdminNoBuildingAssigned from '@/components/admin/AdminNoBuildingAssigned';
import AdminFeedbackTab from '@/components/admin/dashboard/AdminFeedbackTab';
import AdminInboxTab from '@/components/admin/dashboard/AdminInboxTab';
import AdminOverviewTab from '@/components/admin/dashboard/AdminOverviewTab';
import AdminPendingTab from '@/components/admin/dashboard/AdminPendingTab';
import AdminRoomHistoryTab from '@/components/admin/dashboard/AdminRoomHistoryTab';
import AdminRoomsTab from '@/components/admin/dashboard/AdminRoomsTab';
import { getManagedBuildingDisplayLabel } from '@/components/admin/dashboard/shared';
import { useAuth } from '@/context/AuthContext';
import { useAdminTab } from '@/context/AdminTabContext';
import { fetchAdminDashboardSnapshot } from '@/lib/admin/adminDashboard';
import type { AdminRequest } from '@/lib/admin/adminRequests';
import { getManagedBuildingsForCampus } from '@/lib/buildings/campusAssignments';
import { getBuildingById } from '@/lib/buildings/buildings';
import { getFeedbackByBuilding } from '@/lib/feedback/feedback';
import type { Feedback } from '@/lib/feedback/feedback';
import type { FeedbackSentimentSummary } from '@/lib/feedback/feedback-sentiment';
import type { RoomHistoryEntry } from '@/lib/rooms/roomHistory';
import { normalizeRoomCheckInMethod } from '@/lib/rooms/roomStatus';
import type { Room } from '@/lib/rooms/rooms';
import type { Reservation } from '@/lib/reservations/reservations';
import { isRoomInClass, type Schedule } from '@/lib/schedules/schedules';

interface AdminDashboardProps {
  firstName: string;
  activeTab: AdminTab;
}

export default function AdminDashboard({
  firstName,
  activeTab,
}: AdminDashboardProps) {
  const { firebaseUser, profile } = useAuth();
  const { setActiveTab, selectedBuildingId, setSelectedBuildingId } = useAdminTab();

  const managedBuildings = useMemo(
    () => getManagedBuildingsForCampus(profile?.campus),
    [profile?.campus]
  );
  const effectiveManagedBuildingId = managedBuildings.some(
    (building) => building.id === selectedBuildingId
  )
    ? selectedBuildingId
    : managedBuildings[0]?.id ?? '';
  const selectedManagedBuilding =
    managedBuildings.find((building) => building.id === effectiveManagedBuildingId) ??
    managedBuildings[0];
  const buildingId = selectedManagedBuilding?.id;
  const buildingName = selectedManagedBuilding?.name;
  const activeBuildingLabel = getManagedBuildingDisplayLabel({
    id: buildingId,
    name: buildingName,
  });

  const [requests, setRequests] = useState<Reservation[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [feedbackSummary, setFeedbackSummary] =
    useState<FeedbackSentimentSummary | null>(null);
  const [roomHistory, setRoomHistory] = useState<RoomHistoryEntry[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [buildingFloors, setBuildingFloors] = useState(0);

  const reloadDashboard = useCallback(async () => {
    if (!buildingId || !firebaseUser?.uid) {
      return;
    }

    setDashboardLoading(true);

    try {
      const [snapshot, feedbackSnapshot] = await Promise.all([
        fetchAdminDashboardSnapshot(buildingId),
        getFeedbackByBuilding(buildingId),
      ]);

      setAdminRequests(snapshot.adminRequests);
      setAllReservations(snapshot.allReservations);
      setFeedbackList(feedbackSnapshot.feedback);
      setFeedbackSummary(feedbackSnapshot.summary);
      setRequests(snapshot.requests);
      setRoomHistory(snapshot.roomHistory);
      setRooms(snapshot.rooms);
      setSchedules(snapshot.schedules);
    } catch (error) {
      console.warn('Failed to load admin dashboard snapshot:', error);
      setAdminRequests([]);
      setAllReservations([]);
      setFeedbackList([]);
      setFeedbackSummary(null);
      setRequests([]);
      setRoomHistory([]);
      setRooms([]);
      setSchedules([]);
    } finally {
      setDashboardLoading(false);
    }
  }, [buildingId, firebaseUser?.uid]);

  useEffect(() => {
    void reloadDashboard();
  }, [reloadDashboard]);

  useEffect(() => {
    if (buildingId && activeTab === 'manage-rooms') {
      getBuildingById(buildingId).then((building) => {
        if (building) {
          setBuildingFloors(building.floors);
        }
      });
    }
  }, [activeTab, buildingId]);

  const computeEffectiveStatus = useCallback(
    (room: Room): { status: string; detail: string } => {
      if (room.status === 'Unavailable') {
        return { status: 'Unavailable', detail: 'Manual override' };
      }

      if (room.status === 'Occupied') {
        if (
          normalizeRoomCheckInMethod(room.checkInMethod) === 'bluetooth' &&
          room.beaconConnected === false
        ) {
          return { status: 'Available', detail: 'Bluetooth beacon disconnected' };
        }

        return {
          status: 'Occupied',
          detail:
            normalizeRoomCheckInMethod(room.checkInMethod) === 'bluetooth'
              ? 'Bluetooth beacon connected'
              : 'Checked in',
        };
      }

      if (room.status === 'Reserved') {
        return { status: 'Reserved', detail: 'Reserved' };
      }

      const activeClass = isRoomInClass(schedules, room.id);
      if (activeClass) {
        return { status: 'Reserved', detail: `Class: ${activeClass.subjectName}` };
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      const activeReservation = allReservations.find(
        (reservation) =>
          reservation.roomId === room.id &&
          reservation.status === 'approved' &&
          reservation.date === today &&
          reservation.startTime <= currentTime &&
          reservation.endTime > currentTime
      );

      if (activeReservation) {
        const activeCheckInMethod = normalizeRoomCheckInMethod(
          activeReservation.checkInMethod ?? room.checkInMethod
        );

        if (
          activeReservation.checkedInAt &&
          activeCheckInMethod === 'bluetooth' &&
          room.beaconConnected === false
        ) {
          return { status: 'Available', detail: 'Bluetooth beacon disconnected' };
        }

        return activeReservation.checkedInAt
          ? { status: 'Occupied', detail: `Checked in: ${activeReservation.userName}` }
          : { status: 'Reserved', detail: `Reserved: ${activeReservation.userName}` };
      }

      return { status: 'Available', detail: '' };
    },
    [allReservations, schedules]
  );

  const ongoingCount = rooms.filter(
    (room) => computeEffectiveStatus(room).status === 'Occupied'
  ).length;
  const reservedCount = rooms.filter(
    (room) => computeEffectiveStatus(room).status === 'Reserved'
  ).length;
  const unavailableCount = rooms.filter((room) => room.status === 'Unavailable').length;
  const availableCount = rooms.length - ongoingCount - reservedCount - unavailableCount;
  const pendingCount = requests.length;
  const approverEmail = profile?.email || firebaseUser?.email;

  if (!buildingId || !buildingName) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-black">Welcome, {firstName}</h2>
          <p className="text-black mt-1">Administrator Dashboard</p>
        </div>
        <AdminNoBuildingAssigned />
      </main>
    );
  }

  return (
    <main
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${
        activeTab === 'dashboard'
          ? 'py-3 pt-[82px] pb-4'
          : 'py-8 pt-[100px] pb-24 md:pb-8'
      }`}
    >
      <div className={activeTab === 'dashboard' ? 'mb-2' : 'mb-8'}>
        {activeTab === 'dashboard' ? (
          <div className="flex flex-col gap-2 rounded-xl border border-white/30 bg-white px-3 py-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <div>
                <h2 className="text-base font-bold text-gray-800">
                  Welcome, {firstName}
                </h2>
              </div>
              <p className="text-xs font-bold text-gray-600">
                Managing: <span className="text-primary font-bold">{buildingName}</span>
              </p>
            </div>
            {managedBuildings.length > 1 && (
              <div className="w-full sm:w-64">
                <label className="sr-only">
                  Active Building
                </label>
                <select
                  value={buildingId}
                  onChange={(event) => setSelectedBuildingId(event.target.value)}
                  className="glass-input w-full appearance-none bg-dark/6 px-3 py-1.5 text-xs font-bold"
                  style={{ backgroundImage: 'none' }}
                >
                  {managedBuildings.map((building) => (
                    <option key={building.id} value={building.id} className="bg-white text-black">
                      {building.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {activeTab === 'dashboard' && (
        <AdminOverviewTab
          allReservations={allReservations}
          availableCount={availableCount}
          buildingId={buildingId}
          buildingName={buildingName}
          computeEffectiveStatus={computeEffectiveStatus}
          currentUserId={firebaseUser?.uid}
          ongoingCount={ongoingCount}
          pendingCount={pendingCount}
          requests={requests}
          reservedCount={reservedCount}
          rooms={rooms}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'manage-rooms' && (
        <AdminRoomsTab
          activeBuildingLabel={activeBuildingLabel}
          buildingFloors={buildingFloors}
          buildingId={buildingId}
          buildingName={buildingName}
          dashboardLoading={dashboardLoading}
          managedBuildings={managedBuildings}
          onBuildingChange={setSelectedBuildingId}
          onReload={reloadDashboard}
          rooms={rooms}
        />
      )}

      {activeTab === 'feedback' && (
        <AdminFeedbackTab
          feedbackList={feedbackList}
          feedbackSummary={feedbackSummary}
          onReload={reloadDashboard}
        />
      )}

      {activeTab === 'room-history' && (
        <AdminRoomHistoryTab roomHistory={roomHistory} />
      )}

      {activeTab === 'pending' && (
        <AdminPendingTab
          approverEmail={approverEmail}
          buildingName={buildingName}
          requests={requests}
          onReload={reloadDashboard}
        />
      )}

      {activeTab === 'inbox' && (
        <AdminInboxTab
          adminRequests={adminRequests}
          buildingName={buildingName}
          onReload={reloadDashboard}
        />
      )}
    </main>
  );
}
