import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Types ──────────────────────────────────────────────────────
export interface Building {
  id: string;
  name: string;
  code: string;
  address: string;
  floors: number;
  assignedAdminUid: string | null;
  createdAt?: { seconds: number; nanoseconds: number };
  updatedAt?: { seconds: number; nanoseconds: number };
}

// ─── Get All Buildings ──────────────────────────────────────────
export async function getBuildings(): Promise<Building[]> {
  const snap = await getDocs(
    query(collection(db, "buildings"), orderBy("name"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Building));
}

// ─── Get Available Buildings (no admin assigned) ────────────────
export async function getAvailableBuildings(): Promise<Building[]> {
  const all = await getBuildings();
  return all.filter((b) => !b.assignedAdminUid);
}

// ─── Get Building by ID ─────────────────────────────────────────
export async function getBuildingById(buildingId: string): Promise<Building | null> {
  const snap = await getDoc(doc(db, "buildings", buildingId));
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as Building;
  }
  return null;
}

// ─── Get Building Assigned to a Specific Admin ──────────────────
export async function getBuildingByAdmin(adminUid: string): Promise<Building | null> {
  const q = query(
    collection(db, "buildings"),
    where("assignedAdminUid", "==", adminUid)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Building;
}

// ─── Assign Admin to Building ───────────────────────────────────
export async function assignAdminToBuilding(
  buildingId: string,
  adminUid: string
): Promise<void> {
  await updateDoc(doc(db, "buildings", buildingId), {
    assignedAdminUid: adminUid,
    updatedAt: serverTimestamp(),
  });
}

// ─── Unassign Admin from Building ───────────────────────────────
export async function unassignAdminFromBuilding(
  buildingId: string
): Promise<void> {
  await updateDoc(doc(db, "buildings", buildingId), {
    assignedAdminUid: null,
    updatedAt: serverTimestamp(),
  });
}

// ─── Real-time Listener for All Buildings ───────────────────────
export function onBuildings(
  callback: (buildings: Building[]) => void
): Unsubscribe {
  const q = query(collection(db, "buildings"), orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    const buildings: Building[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    } as Building));
    callback(buildings);
  });
}
