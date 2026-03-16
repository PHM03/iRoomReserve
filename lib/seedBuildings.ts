import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Default Buildings for SDCA ─────────────────────────────────
const DEFAULT_BUILDINGS = [
  {
    id: "sdca-main-campus",
    name: "SDCA Main Campus",
    code: "MAIN",
    address: "Emilio Aguinaldo Highway, Bacoor, Cavite",
    floors: 5,
    assignedAdminUid: null,
  },
  {
    id: "sdca-digital-campus",
    name: "SDCA Digital Campus",
    code: "DIGITAL",
    address: "Emilio Aguinaldo Highway, Bacoor, Cavite",
    floors: 3,
    assignedAdminUid: null,
  },
];

/**
 * Seeds the `buildings` collection in Firestore with default
 * SDCA buildings if they don't already exist.
 * Call this once from a component or the browser console.
 */
export async function seedBuildings(): Promise<{
  created: string[];
  skipped: string[];
}> {
  const created: string[] = [];
  const skipped: string[] = [];

  // Check which buildings already exist
  const existing = await getDocs(query(collection(db, "buildings")));
  const existingIds = new Set(existing.docs.map((d) => d.id));

  for (const building of DEFAULT_BUILDINGS) {
    if (existingIds.has(building.id)) {
      skipped.push(building.name);
      continue;
    }

    await setDoc(doc(db, "buildings", building.id), {
      name: building.name,
      code: building.code,
      address: building.address,
      floors: building.floors,
      assignedAdminUid: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    created.push(building.name);
  }

  return { created, skipped };
}
