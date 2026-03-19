import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Types ──────────────────────────────────────────────────────
export interface Room {
  id: string;
  name: string;
  floor: string;
  roomType: string;
  acStatus: string;
  tvProjectorStatus: string;
  capacity: number;
  status: "Available" | "Occupied" | "Unavailable";
  buildingId: string;
  buildingName: string;
  reservedBy: string | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type RoomInput = Omit<Room, "id" | "createdAt" | "updatedAt" | "reservedBy">;

// ─── Add Room ───────────────────────────────────────────────────
export async function addRoom(data: RoomInput): Promise<string> {
  const docRef = await addDoc(collection(db, "rooms"), {
    ...data,
    reservedBy: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

// ─── Update Room ────────────────────────────────────────────────
export async function updateRoom(
  roomId: string,
  data: Partial<Omit<Room, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  await updateDoc(doc(db, "rooms", roomId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ─── Delete Room ────────────────────────────────────────────────
export async function deleteRoom(roomId: string): Promise<void> {
  await deleteDoc(doc(db, "rooms", roomId));
}

// ─── Update Room Status ─────────────────────────────────────────
export async function updateRoomStatus(
  roomId: string,
  status: Room["status"]
): Promise<void> {
  await updateDoc(doc(db, "rooms", roomId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

// ─── Real-time Rooms by Building ────────────────────────────────
export function onRoomsByBuilding(
  buildingId: string,
  callback: (rooms: Room[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "rooms"),
    where("buildingId", "==", buildingId),
    orderBy("floor"),
    orderBy("name")
  );
  return onSnapshot(q, (snapshot) => {
    const rooms: Room[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    } as Room));
    callback(rooms);
  }, (error) => {
    console.warn('Firestore listener error (rooms):', error);
  });
}
