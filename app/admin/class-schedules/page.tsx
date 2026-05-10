'use client';

import { useMemo, useState } from 'react';

import AdminClassSchedulesSection from '@/components/admin/AdminClassSchedulesSection';
import AdminNoBuildingAssigned from '@/components/admin/AdminNoBuildingAssigned';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { getFloorDisplayLabel } from '@/lib/buildings/floorLabels';
import { useAdminStatusPages } from '@/hooks/useAdminStatusPages';

const FLOOR_FILTER_OPTIONS = ['1st Floor', '2nd Floor', '3rd Floor', '4th Floor'];

export default function AdminClassSchedulesPage() {
  const {
    managedBuildings,
    buildingId,
    buildingName,
    activeBuildingLabel,
    setSelectedBuildingId,
    rooms,
    schedules,
    showScheduleForm,
    schedRoomId,
    setSchedRoomId,
    schedSubject,
    setSchedSubject,
    schedInstructor,
    setSchedInstructor,
    schedDay,
    setSchedDay,
    schedStart,
    setSchedStart,
    schedEnd,
    setSchedEnd,
    addingSchedule,
    editingScheduleId,
    toggleScheduleForm,
    handleSaveSchedule,
    handleEditSchedule,
    handleDeleteSchedule,
  } = useAdminStatusPages();
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [clearButtonPressed, setClearButtonPressed] = useState(false);
  const roomLookup = useMemo(
    () => Object.fromEntries(rooms.map((room) => [room.id, room] as const)),
    [rooms]
  );
  const hasActiveScheduleFilters = Boolean(selectedRoom || selectedFloor);
  const roomFilterOptions = useMemo(
    () =>
      [...new Set(schedules.map((schedule) => schedule.roomName).filter(Boolean))]
        .sort((left, right) => left.localeCompare(right, undefined, { numeric: true })),
    [schedules]
  );
  const filteredSchedules = useMemo(() => {
    const query = scheduleSearchQuery.trim().toLowerCase();

    return schedules.filter((schedule) =>
      (!query ||
        [schedule.subjectName, schedule.roomName, schedule.instructorName]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query))) &&
      (!selectedRoom || schedule.roomName === selectedRoom) &&
      (!selectedFloor ||
        getFloorDisplayLabel(roomLookup[schedule.roomId]?.floor ?? '', {
          id: roomLookup[schedule.roomId]?.buildingId,
          name: roomLookup[schedule.roomId]?.buildingName,
        }) === selectedFloor)
    );
  }, [roomLookup, scheduleSearchQuery, schedules, selectedFloor, selectedRoom]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[100px] py-8 relative z-10">
      {!buildingId || !buildingName ? (
        <AdminNoBuildingAssigned />
      ) : (
        <div className="flex w-full flex-col gap-4">
          <AdminPageHeader
            title="Class Schedules"
            description={
              <>
                Manage class schedule assignments for{' '}
                <span className="font-bold text-[#8B0000]">{buildingName}</span>.
              </>
            }
            managedBuildings={managedBuildings}
            buildingId={buildingId}
            buildingName={buildingName}
            activeBuildingLabel={activeBuildingLabel}
            onBuildingChange={setSelectedBuildingId}
            integratedBuildingField
          />

          <div className="w-full rounded-xl bg-white px-6 py-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <div className="relative">
              <svg
                className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by subject, room, or professor..."
                value={scheduleSearchQuery}
                onChange={(event) => setScheduleSearchQuery(event.target.value)}
                className="w-full border-0 bg-transparent py-2 pl-7 pr-2 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex w-full flex-row items-center gap-3 rounded-xl bg-white px-6 py-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <span>Room</span>
              <select
                value={selectedRoom}
                onChange={(event) => setSelectedRoom(event.target.value)}
                className="min-w-[150px] rounded-lg border border-[#e0e0e0] bg-white px-[14px] py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select Room</option>
                {roomFilterOptions.map((roomName) => (
                  <option key={roomName} value={roomName}>
                    {roomName}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <span>Floor</span>
              <select
                value={selectedFloor}
                onChange={(event) => setSelectedFloor(event.target.value)}
                className="min-w-[150px] rounded-lg border border-[#e0e0e0] bg-white px-[14px] py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select Floor</option>
                {FLOOR_FILTER_OPTIONS.map((floor) => (
                  <option key={floor} value={floor}>
                    {floor}
                  </option>
                ))}
              </select>
            </label>

            <button
              onClick={() => {
                if (!hasActiveScheduleFilters) {
                  return;
                }

                setClearButtonPressed(true);
                setSelectedRoom('');
                setSelectedFloor('');
                window.setTimeout(() => setClearButtonPressed(false), 150);
              }}
              aria-disabled={!hasActiveScheduleFilters}
              className={`rounded-lg border px-[14px] py-2 text-sm font-bold transition-all duration-200 ease-in-out ${
                clearButtonPressed
                  ? 'border-[#8B0000] bg-[#8B0000] text-white'
                  : hasActiveScheduleFilters
                    ? 'cursor-pointer border-[#8B0000] bg-transparent text-[#8B0000] pointer-events-auto hover:bg-[#fff0f0]'
                    : 'pointer-events-none cursor-default border-[#cccccc] bg-transparent text-[#999999]'
              }`}
            >
              Clear
            </button>
          </div>

          <AdminClassSchedulesSection
            schedules={filteredSchedules}
            rooms={rooms}
            showScheduleForm={showScheduleForm}
            schedRoomId={schedRoomId}
            schedSubject={schedSubject}
            schedInstructor={schedInstructor}
            schedDay={schedDay}
            schedStart={schedStart}
            schedEnd={schedEnd}
            addingSchedule={addingSchedule}
            editingScheduleId={editingScheduleId}
            onToggleForm={toggleScheduleForm}
            onSchedRoomIdChange={setSchedRoomId}
            onSchedSubjectChange={setSchedSubject}
            onSchedInstructorChange={setSchedInstructor}
            onSchedDayChange={setSchedDay}
            onSchedStartChange={setSchedStart}
            onSchedEndChange={setSchedEnd}
            onSaveSchedule={handleSaveSchedule}
            onEditSchedule={handleEditSchedule}
            onDeleteSchedule={handleDeleteSchedule}
          />
        </div>
      )}
    </main>
  );
}
