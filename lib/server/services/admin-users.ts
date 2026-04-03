import "server-only";

import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  writeBatch,
  where,
} from "firebase/firestore";

import {
  getCampusName,
  getManagedBuildingIdsForCampus,
  resolveCampusAssignment,
} from "../../campusAssignments";
import { normalizeRole, USER_ROLES, type UserRole } from "@/lib/domain/roles";
import { type ReservationCampus } from "@/lib/campuses";
import { serverClientDb } from "@/lib/server/firebase-client";
import { getOptionalAdminAuth } from "@/lib/server/firebase-admin";

async function clearManagedCampusIfNeeded(uid: string) {
  const userSnapshot = await getDoc(doc(serverClientDb, "users", uid));
  if (!userSnapshot.exists()) {
    return null;
  }

  const userData = userSnapshot.data() as {
    role?: string;
    campus?: string | null;
    campusName?: string | null;
    assignedBuilding?: string | null;
    assignedBuildingId?: string | null;
    assignedBuildingIds?: string[];
    assignedBuildings?: unknown;
  };

  const { campus } = resolveCampusAssignment(userData);
  const normalizedRole = normalizeRole(userData.role);
  const shouldClearManagedCampus =
    campus &&
    (normalizedRole === USER_ROLES.ADMIN ||
      normalizedRole === USER_ROLES.UTILITY);

  if (!shouldClearManagedCampus) {
    return null;
  }

  const buildingsSnapshot = await getDocs(
    query(
      collection(serverClientDb, "buildings"),
      where("assignedAdminUid", "==", uid)
    )
  );

  return {
    campus,
    buildingRefs: buildingsSnapshot.docs.map((buildingDoc) => buildingDoc.ref),
  };
}

export async function approveUserProfile(uid: string) {
  const batch = writeBatch(serverClientDb);
  batch.update(doc(serverClientDb, "users", uid), {
    status: "approved",
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function approveManagedUserProfile(
  uid: string,
  role: UserRole,
  campus: ReservationCampus
) {
  const managedBuildingIds = getManagedBuildingIdsForCampus(campus);
  if (managedBuildingIds.length === 0) {
    throw new Error("A managed campus is required.");
  }

  const existingAssignment = await clearManagedCampusIfNeeded(uid);
  const batch = writeBatch(serverClientDb);
  batch.update(doc(serverClientDb, "users", uid), {
    status: "approved",
    role,
    campus,
    campusName: getCampusName(campus),
    assignedBuilding: deleteField(),
    assignedBuildingId: deleteField(),
    assignedBuildings: deleteField(),
    assignedBuildingIds: deleteField(),
    updatedAt: serverTimestamp(),
  });
  existingAssignment?.buildingRefs.forEach((buildingRef) => {
    batch.update(buildingRef, {
      assignedAdminUid: null,
      updatedAt: serverTimestamp(),
    });
  });
  managedBuildingIds.forEach((buildingId) => {
    batch.update(doc(serverClientDb, "buildings", buildingId), {
      assignedAdminUid: uid,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

export async function rejectUserProfile(uid: string) {
  const managedCampus = await clearManagedCampusIfNeeded(uid);
  const batch = writeBatch(serverClientDb);
  batch.update(doc(serverClientDb, "users", uid), {
    status: "rejected",
    campus: deleteField(),
    campusName: deleteField(),
    assignedBuilding: deleteField(),
    assignedBuildingId: deleteField(),
    assignedBuildings: deleteField(),
    assignedBuildingIds: deleteField(),
    updatedAt: serverTimestamp(),
  });
  managedCampus?.buildingRefs.forEach((buildingRef) => {
    batch.update(buildingRef, {
      assignedAdminUid: null,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

export async function disableUserProfile(uid: string) {
  const batch = writeBatch(serverClientDb);
  batch.update(doc(serverClientDb, "users", uid), {
    status: "disabled",
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function enableUserProfile(uid: string) {
  const batch = writeBatch(serverClientDb);
  batch.update(doc(serverClientDb, "users", uid), {
    status: "approved",
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function deleteUserProfile(uid: string) {
  const managedCampus = await clearManagedCampusIfNeeded(uid);
  const batch = writeBatch(serverClientDb);
  batch.delete(doc(serverClientDb, "users", uid));
  managedCampus?.buildingRefs.forEach((buildingRef) => {
    batch.update(buildingRef, {
      assignedAdminUid: null,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();

  const adminAuth = getOptionalAdminAuth();
  if (adminAuth) {
    try {
      await adminAuth.deleteUser(uid);
    } catch {
      // Firestore deletion remains the compatibility fallback when Admin SDK is unavailable.
    }
  }
}
