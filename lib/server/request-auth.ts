import "server-only";

import type { NextRequest } from "next/server";
import { doc, getDoc } from "firebase/firestore";

import { normalizeAssignedBuildings } from "@/lib/assignedBuildings";
import { type ReservationCampus } from "@/lib/campuses";
import { normalizeRole, type UserRole } from "@/lib/domain/roles";
import { resolveCampusAssignment } from "../campusAssignments";
import { serverClientDb } from "@/lib/server/firebase-client";
import { getOptionalAdminAuth } from "@/lib/server/firebase-admin";

export interface RequestAuthContext {
  uid: string | null;
  role: UserRole | null;
  email: string | null;
  campus: ReservationCampus | null;
  assignedBuildingId: string | null;
  assignedBuildingIds: string[];
  verified: boolean;
}

async function getProfileContext(uid: string) {
  const profileSnapshot = await getDoc(doc(serverClientDb, "users", uid));
  if (!profileSnapshot.exists()) {
    return {
      role: null,
      email: null,
      campus: null,
      assignedBuildingId: null,
      assignedBuildingIds: [],
    };
  }

  const profileData = profileSnapshot.data() as {
    role?: string;
    email?: string | null;
    campus?: string | null;
    campusName?: string | null;
    assignedBuildingId?: string | null;
    assignedBuilding?: string | null;
    assignedBuildingIds?: string[];
    assignedBuildings?: unknown;
  };

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
  request: NextRequest
): Promise<RequestAuthContext> {
  const fallbackUid = request.headers.get("x-user-id");
  const fallbackRole = normalizeRole(request.headers.get("x-user-role"));
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const adminAuth = getOptionalAdminAuth();

    if (adminAuth) {
      try {
        const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
        const profileContext = await getProfileContext(decoded.uid);
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
        // Fall through to compatibility headers so the current project keeps working
        // until Firebase Admin credentials are configured.
      }
    }
  }

  const fallbackProfileContext = fallbackUid
    ? await getProfileContext(fallbackUid)
    : {
        role: null,
        email: null,
        campus: null,
        assignedBuildingId: null,
        assignedBuildingIds: [],
      };

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
