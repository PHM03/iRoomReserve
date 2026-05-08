'use client';

import { useMemo, useState } from 'react';
import { getBuildingFloorOptions, getFloorDisplayLabel } from '@/lib/buildings/floorLabels';
import {
  addRoom,
  deleteRoom,
  updateRoom,
  type Room,
  type RoomInput,
} from '@/lib/rooms/rooms';
import {
  getManagedBuildingOptionLabel,
  ROOM_AC_OPTIONS,
  ROOM_DISPLAY_OPTIONS,
  ROOM_TYPE_LABELS,
  ROOM_TYPE_OPTIONS,
  StatusBadge,
} from './shared';

interface BuildingOption {
  id: string;
  name: string;
}

interface AdminRoomsTabProps {
  activeBuildingLabel: string;
  buildingFloors: number;
  buildingId: string;
  buildingName: string;
  dashboardLoading: boolean;
  managedBuildings: BuildingOption[];
  onBuildingChange: (buildingId: string) => void;
  onReload: () => Promise<void>;
  rooms: Room[];
}

function sortFloors(floors: string[]) {
  return [...floors].sort((left, right) => {
    const floorOrder = (value: string) => {
      if (value.toLowerCase().includes('ground')) {
        return 0;
      }

      const match = value.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 999;
    };

    return floorOrder(left) - floorOrder(right);
  });
}

export default function AdminRoomsTab({
  activeBuildingLabel,
  buildingFloors,
  buildingId,
  buildingName,
  dashboardLoading,
  managedBuildings,
  onBuildingChange,
  onReload,
  rooms,
}: AdminRoomsTabProps) {
  const [addRoomStep, setAddRoomStep] = useState(0);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState('');
  const [newRoomType, setNewRoomType] = useState('');
  const [newRoomAcStatus, setNewRoomAcStatus] = useState('');
  const [newRoomTvStatus, setNewRoomTvStatus] = useState('');
  const [newRoomBeaconId, setNewRoomBeaconId] = useState('');
  const [addingRoom, setAddingRoom] = useState(false);

  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editFloor, setEditFloor] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  const [editRoomType, setEditRoomType] = useState('');
  const [editAcStatus, setEditAcStatus] = useState('');
  const [editTvStatus, setEditTvStatus] = useState('');
  const [editBeaconId, setEditBeaconId] = useState('');
  const [savingRoomId, setSavingRoomId] = useState<string | null>(null);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);

  const [roomSearch, setRoomSearch] = useState('');
  const [roomFloorFilter, setRoomFloorFilter] = useState('all');

  const uniqueFloors = useMemo(
    () => sortFloors(Array.from(new Set(rooms.map((room) => room.floor)))),
    [rooms]
  );
  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) => {
        if (roomFloorFilter !== 'all' && room.floor !== roomFloorFilter) {
          return false;
        }

        if (roomSearch && !room.name.toLowerCase().includes(roomSearch.toLowerCase())) {
          return false;
        }

        return true;
      }),
    [roomFloorFilter, roomSearch, rooms]
  );
  const floorOptions = getBuildingFloorOptions({
    id: buildingId,
    name: buildingName,
    floors: buildingFloors,
  });

  const resetAddRoomWizard = () => {
    setAddRoomStep(0);
    setNewRoomName('');
    setNewRoomFloor('');
    setNewRoomCapacity('');
    setNewRoomType('');
    setNewRoomAcStatus('');
    setNewRoomTvStatus('');
    setNewRoomBeaconId('');
  };

  const resetEditRoomForm = () => {
    setEditingRoomId(null);
    setEditName('');
    setEditFloor('');
    setEditCapacity('');
    setEditRoomType('');
    setEditAcStatus('');
    setEditTvStatus('');
    setEditBeaconId('');
  };

  const startEditingRoom = (room: Room) => {
    setEditingRoomId(room.id);
    setEditName(room.name);
    setEditFloor(room.floor);
    setEditCapacity(String(room.capacity));
    setEditRoomType(room.roomType || '');
    setEditAcStatus(room.acStatus || 'No Air Conditioning');
    setEditTvStatus(room.tvProjectorStatus || 'No Television or Projector');
    setEditBeaconId(room.beaconId || '');
  };

  const handleAddRoomBuildingChange = (nextBuildingId: string) => {
    if (!nextBuildingId || nextBuildingId === buildingId) {
      return;
    }

    onBuildingChange(nextBuildingId);
    setNewRoomFloor('');

    if (addRoomStep === 2) {
      setAddRoomStep(1);
    }
  };

  const handleAddRoom = async () => {
    if (!buildingId || !buildingName || !newRoomName.trim() || !newRoomFloor.trim() || !newRoomType) {
      return;
    }

    setAddingRoom(true);

    try {
      const data: RoomInput = {
        name: newRoomName.trim(),
        floor: newRoomFloor.trim(),
        roomType: newRoomType,
        acStatus: newRoomAcStatus || 'No Air Conditioning',
        tvProjectorStatus: newRoomTvStatus || 'No Television or Projector',
        capacity: parseInt(newRoomCapacity, 10) || 30,
        status: 'Available',
        buildingId,
        buildingName,
        beaconId: newRoomBeaconId.trim() || null,
      };

      await addRoom(data);
      resetAddRoomWizard();
      await onReload();
    } catch (error) {
      console.warn('Failed to add room:', error);
    } finally {
      setAddingRoom(false);
    }
  };

  const handleEditRoom = async (roomId: string) => {
    if (!editName.trim() || !editFloor.trim() || !editRoomType) {
      return;
    }

    setSavingRoomId(roomId);

    try {
      await updateRoom(roomId, {
        name: editName.trim(),
        floor: editFloor.trim(),
        roomType: editRoomType,
        acStatus: editAcStatus || 'No Air Conditioning',
        tvProjectorStatus: editTvStatus || 'No Television or Projector',
        capacity: parseInt(editCapacity, 10) || 30,
        beaconId: editBeaconId.trim() || null,
      });
      resetEditRoomForm();
      await onReload();
    } catch (error) {
      console.warn('Failed to update room:', error);
      alert('Failed to update room. Please try again.');
    } finally {
      setSavingRoomId(null);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) {
      return;
    }

    setDeletingRoomId(roomId);

    try {
      await deleteRoom(roomId);
      if (editingRoomId === roomId) {
        resetEditRoomForm();
      }
      await onReload();
    } catch (error) {
      console.warn('Failed to delete:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete room. Please try again.');
    } finally {
      setDeletingRoomId(null);
    }
  };

  return (
    <div>
      <div className="bg-white rounded-xl px-6 py-4 border border-white/30 inline-block mb-6">
        <h3 className="text-xl font-bold text-gray-800">Manage Rooms</h3>
      </div>

      {addRoomStep === 0 && (
        <div className="mb-8 space-y-3">
          <button
            onClick={() => setAddRoomStep(1)}
            className="w-full glass-card p-6 !rounded-2xl flex items-center justify-center gap-3 group hover:!border-primary/40 transition-all cursor-pointer"
          >
            <svg className="w-6 h-6 text-black group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-lg font-bold text-black group-hover:text-primary transition-colors">
              New Room
            </span>
          </button>

          <div className="rounded-xl border border-[#d9a3a4] bg-[#f9eded] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-black">Active Building</p>
            <p className="mt-1 text-sm font-bold text-black">{activeBuildingLabel}</p>
            {buildingName && activeBuildingLabel !== buildingName ? (
              <p className="mt-1 text-xs text-black">{buildingName}</p>
            ) : null}
          </div>
        </div>
      )}

      {addRoomStep === 1 && (
        <div className="glass-card p-6 mb-8 !rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-bold text-black">Select Floor</h4>
              <p className="text-xs text-black mt-0.5">Step 1 of 2 - Choose which floor the room is on</p>
            </div>
            <button
              onClick={resetAddRoomWizard}
              className="p-2 rounded-lg text-black hover:text-primary hover:bg-primary/10 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex gap-2 mb-6">
            <div className="h-1 flex-1 rounded-full bg-primary" />
            <div className="h-1 flex-1 rounded-full bg-dark/10" />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-bold text-black mb-1.5">Building</label>
            {managedBuildings.length > 1 ? (
              <select
                value={buildingId}
                onChange={(event) => handleAddRoomBuildingChange(event.target.value)}
                className="glass-input w-full px-4 py-2.5 text-sm appearance-none cursor-pointer"
              >
                {managedBuildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {getManagedBuildingOptionLabel(building)}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                <p className="text-sm font-bold text-black">{activeBuildingLabel}</p>
                {buildingName && activeBuildingLabel !== buildingName ? (
                  <p className="mt-1 text-xs text-black">{buildingName}</p>
                ) : null}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {floorOptions.map((floorOption, index) => (
              <button
                key={floorOption.value}
                onClick={() => {
                  setNewRoomFloor(floorOption.value);
                  setAddRoomStep(2);
                }}
                className="glass-card !bg-dark/5 p-4 !rounded-xl text-center group hover:!border-primary/40 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <span className="text-primary font-bold text-sm">
                    {floorOption.label === 'Basement Floor'
                      ? 'B'
                      : floorOption.label === 'Ground Floor'
                        ? 'G'
                        : floorOption.label.match(/(\d+)/)?.[1] ?? index}
                  </span>
                </div>
                <p className="text-sm font-bold text-black group-hover:text-primary transition-colors">
                  {floorOption.label}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {addRoomStep === 2 && (
        <div className="glass-card p-6 mb-8 !rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-bold text-black">Room Information</h4>
              <p className="text-xs text-black mt-0.5">
                Step 2 of 2 - <span className="text-primary">{getFloorDisplayLabel(newRoomFloor, { id: buildingId, name: buildingName })}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAddRoomStep(1)}
                className="p-2 rounded-lg text-black hover:text-primary hover:bg-primary/10 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={resetAddRoomWizard}
                className="p-2 rounded-lg text-black hover:text-primary hover:bg-primary/10 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex gap-2 mb-6">
            <div className="h-1 flex-1 rounded-full bg-primary" />
            <div className="h-1 flex-1 rounded-full bg-primary" />
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">Room Name *</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(event) => setNewRoomName(event.target.value)}
                  placeholder="e.g. Room 312"
                  className="glass-input w-full px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">Room Type *</label>
                <select
                  value={newRoomType}
                  onChange={(event) => setNewRoomType(event.target.value)}
                  className="glass-input w-full px-4 py-2.5 text-sm appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select room type</option>
                  {ROOM_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {ROOM_TYPE_LABELS[option]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-black mb-1.5">Beacon ID</label>
              <input
                type="text"
                value={newRoomBeaconId}
                onChange={(event) => setNewRoomBeaconId(event.target.value)}
                placeholder="e.g. ESP32_ROOM_301"
                className="glass-input w-full px-4 py-2.5 text-sm"
              />
              <p className="mt-1.5 text-xs text-black">
                Use the exact ESP32 BLE device name for Bluetooth room check-in.
              </p>
            </div>

            <div>
              <h5 className="text-sm font-bold text-black uppercase tracking-wider mb-4">Facilities</h5>

              <div className="mb-4">
                <label className="block text-xs font-bold text-black mb-2">Air Conditioner Status</label>
                <div className="flex flex-wrap gap-2">
                  {ROOM_AC_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setNewRoomAcStatus(option)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        newRoomAcStatus === option
                          ? 'bg-primary/20 text-primary border border-primary/40'
                          : 'bg-dark/5 text-black border border-dark/10 hover:bg-primary/10 hover:text-primary'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-black mb-2">Television or Projector</label>
                <div className="flex flex-wrap gap-2">
                  {ROOM_DISPLAY_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setNewRoomTvStatus(option)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        newRoomTvStatus === option
                          ? 'bg-primary/20 text-primary border border-primary/40'
                          : 'bg-dark/5 text-black border border-dark/10 hover:bg-primary/10 hover:text-primary'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1.5">Capacity</label>
                <input
                  type="number"
                  value={newRoomCapacity}
                  onChange={(event) => setNewRoomCapacity(event.target.value)}
                  placeholder="30"
                  className="glass-input w-full sm:w-40 px-4 py-2.5 text-sm"
                  min={1}
                />
              </div>
            </div>

            <button
              onClick={handleAddRoom}
              disabled={addingRoom || !newRoomName.trim() || !newRoomType}
              className="btn-primary w-full py-3 px-4 text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {addingRoom ? 'Adding Room...' : 'Add Room'}
            </button>
          </div>
        </div>
      )}

      {rooms.length > 0 && (
        <div className="mb-6 space-y-4">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={roomSearch}
              onChange={(event) => setRoomSearch(event.target.value)}
              placeholder="Search rooms by name..."
              className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRoomFloorFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                roomFloorFilter === 'all'
                  ? 'bg-[#a12124] text-white border border-[#a12124]'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              All ({rooms.length})
            </button>
            {uniqueFloors.map((floor) => {
              const count = rooms.filter((room) => room.floor === floor).length;
              return (
                <button
                  key={floor}
                  onClick={() => setRoomFloorFilter(floor)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    roomFloorFilter === floor
                      ? 'bg-[#a12124] text-white border border-[#a12124]'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {getFloorDisplayLabel(floor, { id: buildingId, name: buildingName })} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {dashboardLoading && rooms.length === 0 && addRoomStep === 0 ? (
        <div className="glass-card p-12 text-center">
          <h4 className="text-lg font-bold text-black mb-1">Loading rooms...</h4>
          <p className="text-sm text-black">Fetching the latest building snapshot.</p>
        </div>
      ) : rooms.length === 0 && addRoomStep === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-3">Rooms</div>
          <h4 className="text-lg font-bold text-black mb-1">No Rooms Yet</h4>
          <p className="text-sm text-black">Click &quot;New Room&quot; above to add your first room.</p>
        </div>
      ) : filteredRooms.length === 0 && rooms.length > 0 ? (
        <div className="glass-card p-8 text-center">
          <div className="text-3xl mb-3">Search</div>
          <h4 className="text-lg font-bold text-black mb-1">No Rooms Found</h4>
          <p className="text-sm text-black">Try adjusting your search or filter.</p>
        </div>
      ) : filteredRooms.length > 0 ? (
        <div className="space-y-3">
          {filteredRooms.map((room) => (
            <div key={room.id} className="glass-card p-4 sm:p-5">
              {editingRoomId === room.id ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-black">Room Name *</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        className="glass-input w-full px-4 py-2.5 text-sm"
                        placeholder="e.g. Room 312"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-black">Floor *</label>
                      <select
                        value={editFloor}
                        onChange={(event) => setEditFloor(event.target.value)}
                        className="glass-input w-full cursor-pointer appearance-none px-4 py-2.5 text-sm"
                      >
                        <option value="" disabled>Select floor</option>
                        {floorOptions.map((floorOption) => (
                          <option key={floorOption.value} value={floorOption.value}>
                            {floorOption.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-bold text-black">Room Type *</label>
                      <select
                        value={editRoomType}
                        onChange={(event) => setEditRoomType(event.target.value)}
                        className="glass-input w-full cursor-pointer appearance-none px-4 py-2.5 text-sm"
                      >
                        <option value="" disabled>Select room type</option>
                        {ROOM_TYPE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {ROOM_TYPE_LABELS[option]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-xs font-bold text-black">Beacon ID</label>
                      <input
                        type="text"
                        value={editBeaconId}
                        onChange={(event) => setEditBeaconId(event.target.value)}
                        className="glass-input w-full px-4 py-2.5 text-sm"
                        placeholder="e.g. ESP32_ROOM_301"
                      />
                    </div>
                  </div>

                  <div>
                    <h5 className="mb-4 text-sm font-bold uppercase tracking-wider text-black">Facilities</h5>
                    <div className="mb-4">
                      <label className="mb-2 block text-xs font-bold text-black">Air Conditioner Status</label>
                      <div className="flex flex-wrap gap-2">
                        {ROOM_AC_OPTIONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setEditAcStatus(option)}
                            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                              editAcStatus === option
                                ? 'border border-primary/40 bg-primary/20 text-primary'
                                : 'border border-dark/10 bg-dark/5 text-black hover:bg-primary/10 hover:text-primary'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="mb-2 block text-xs font-bold text-black">Television or Projector</label>
                      <div className="flex flex-wrap gap-2">
                        {ROOM_DISPLAY_OPTIONS.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setEditTvStatus(option)}
                            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                              editTvStatus === option
                                ? 'border border-primary/40 bg-primary/20 text-primary'
                                : 'border border-dark/10 bg-dark/5 text-black hover:bg-primary/10 hover:text-primary'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-black">Capacity</label>
                      <input
                        type="number"
                        value={editCapacity}
                        onChange={(event) => setEditCapacity(event.target.value)}
                        className="glass-input w-full px-4 py-2.5 text-sm sm:w-40"
                        placeholder="30"
                        min={1}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleEditRoom(room.id)}
                      disabled={
                        savingRoomId === room.id ||
                        !editName.trim() ||
                        !editFloor.trim() ||
                        !editRoomType
                      }
                      className="px-4 py-2 rounded-xl text-sm font-bold ui-button-green"
                    >
                      {savingRoomId === room.id ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={resetEditRoomForm}
                      disabled={savingRoomId === room.id}
                      className="px-4 py-2 rounded-xl text-sm font-bold bg-dark/5 text-black border border-dark/10 hover:bg-primary/10 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-lg shrink-0">
                      R
                    </div>
                    <div>
                      <h4 className="font-bold text-black text-sm">{room.name}</h4>
                      <p className="text-xs text-black">
                        {getFloorDisplayLabel(room.floor, {
                          id: room.buildingId,
                          name: room.buildingName,
                        })}{' '}
                        · {room.roomType || 'Room'} · Capacity: {room.capacity}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={room.status} />
                    <button
                      onClick={() => startEditingRoom(room)}
                      disabled={deletingRoomId === room.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-black hover:text-primary hover:bg-primary/10 border border-dark/10 transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room.id)}
                      disabled={deletingRoomId === room.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold ui-button-ghost ui-text-red ui-button-ghost-danger disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingRoomId === room.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
