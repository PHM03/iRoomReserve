import "server-only";

import type { NextRequest } from "next/server";

import { normalizeAssignedBuildings } from "@/lib/assignedBuildings";
import { type ReservationCampus } from "@/lib/campuses";
import { auth as adminAuth, db } from "@/lib/configs/firebase-admin";
import { normalizeRole, type UserRole } from "@/lib/domain/roles";
import { resolveCampusAssignment } from "../campusAssignments";

export interface RequestAuthContext {
  uid: string | null;
  role: UserRole | null;
  email: string | null;
  campus: ReservationCampus | null;
  assignedBuildingId: string | null;
  assignedBuildingIds: string[];
  verified: boolean;
}

interface UserProfileData {
  role?: string;
  email?: string | null;
  campus?: string | null;
  campusName?: string | null;
  assignedBuildingId?: string | null;
  assignedBuilding?: string | null;
  assignedBuildingIds?: string[];
  assignedBuildings?: unknown;
}

interface GetRequestAuthContextOptions {
  includeProfile?: boolean;
}

function getEmptyProfileContext() {
  return {
    role: null,
    email: null,
    campus: null,
    assignedBuildingId: null,
    assignedBuildingIds: [] as string[],
  };
}

async function getProfileContext(uid: string) {
  let profileData: UserProfileData | null = null;
  const profileSnapshot = await db.collection("users").doc(uid).get();
  if (profileSnapshot.exists) {
    profileData = profileSnapshot.data() as UserProfileData;
  }

  if (!profileData) {
    return getEmptyProfileContext();
  }

  const assignedBuildings = normalizeAssignedBuildings(profileData);
  const { campus } = resolveCampusAssignment(profileData);

  return {
    role: normalizeRole(profileData.role),
    email: profileData.email?.trim().toLowerCase() ?? null,
    campus,
    assignedBuildingId:
      assignedBuildings[0]?.id ?? profileData.assignedBuildingId ?? null,
    assignedBuildingIds: assignedBuildings.map((building) => building.id),
  };
}

export async function getRequestAuthContext(
  request: NextRequest,
  options: GetRequestAuthContextOptions = {}
): Promise<RequestAuthContext> {
  const { includeProfile = true } = options;
  const fallbackUid = request.headers.get("x-user-id");
  const fallbackRole = normalizeRole(request.headers.get("x-user-role"));
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    try {
      const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
      const profileContext = includeProfile
        ? await getProfileContext(decoded.uid)
        : getEmptyProfileContext();
      return {
        uid: decoded.uid,
        role: profileContext.role ?? fallbackRole,
        email: profileContext.email ?? decoded.email?.trim().toLowerCase() ?? null,
        campus: profileContext.campus,
        assignedBuildingId: profileContext.assignedBuildingId,
        assignedBuildingIds: profileContext.assignedBuildingIds,
        verified: true,
      };
    } catch {
      // Fall through to compatibility headers when the bearer token is invalid.
    }
  }

  const fallbackProfileContext =
    includeProfile && fallbackUid
      ? await getProfileContext(fallbackUid)
      : getEmptyProfileContext();

  return {
    uid: fallbackUid,
    role: fallbackProfileContext.role ?? fallbackRole,
    email: fallbackProfileContext.email,
    campus: fallbackProfileContext.campus,
    assignedBuildingId: fallbackProfileContext.assignedBuildingId,
    assignedBuildingIds: fallbackProfileContext.assignedBuildingIds,
    verified: false,
  };
}
