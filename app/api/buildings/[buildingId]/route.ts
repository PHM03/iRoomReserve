import { NextRequest, NextResponse } from "next/server";

import { getBuildingById } from "@/lib/buildings";
import { ApiError, handleApiError } from "@/lib/server/api-error";
import { getRequestAuthContext } from "@/lib/server/request-auth";
import { assertAuthenticated } from "@/lib/server/route-guards";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ buildingId: string }> }
) {
  try {
    const authContext = await getRequestAuthContext(request);
    assertAuthenticated(authContext);

    const { buildingId } = await params;
    const building = await getBuildingById(buildingId);

    if (!building) {
      throw new ApiError(404, "not_found", "Building not found.");
    }

    return NextResponse.json(building);
  } catch (error) {
    return handleApiError(error);
  }
}
