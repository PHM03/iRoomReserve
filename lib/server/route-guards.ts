import type { RequestAuthContext } from "@/lib/server/request-auth";
import { USER_ROLES, type UserRole } from "../domain/roles";
import { ApiError } from "./api-error";
import { isCampusManagedBuilding } from "../campusAssignments";

export function assertAuthenticated(context: RequestAuthContext) {
  if (!context.uid) {
    throw new ApiError(401, "unauthenticated", "Authentication is required.");
  }
}

export function assertOwnsResource(
  context: RequestAuthContext,
  resourceOwnerUid: string
) {
  assertAuthenticated(context);

  if (context.uid !== resourceOwnerUid) {
    throw new ApiError(403, "forbidden", "You are not allowed to access this resource.");
  }
}

export function assertRole(
  context: RequestAuthContext,
  allowedRoles: readonly UserRole[]
) {
  assertAuthenticated(context);

  if (!context.role || !allowedRoles.includes(context.role)) {
    throw new ApiError(403, "forbidden", "You do not have permission to perform this action.");
  }
}

export function assertCanManageBuilding(
  context: RequestAuthContext,
  buildingId: string
) {
  assertAuthenticated(context);

  if (context.role === USER_ROLES.SUPER_ADMIN) {
    return;
  }

  if (
    context.role !== USER_ROLES.ADMIN &&
    context.role !== USER_ROLES.UTILITY
  ) {
    throw new ApiError(403, "forbidden", "You do not have permission to manage this building.");
  }

  if (
    !isCampusManagedBuilding(context.campus, buildingId) &&
    !context.assignedBuildingIds.includes(buildingId) &&
    (!context.assignedBuildingId || context.assignedBuildingId !== buildingId)
  ) {
    throw new ApiError(403, "forbidden", "You can only manage resources for your assigned campus.");
  }
}
