import { NextRequest, NextResponse } from "next/server";

import { getBuildings } from "@/lib/buildings";
import { handleApiError } from "@/lib/server/api-error";
import { getRequestAuthContext } from "@/lib/server/request-auth";
import { assertAuthenticated } from "@/lib/server/route-guards";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getRequestAuthContext(request);
    assertAuthenticated(authContext);

    const { searchParams } = new URL(request.url);
    const campus = searchParams.get("campus");

    const buildings = await getBuildings();
    return NextResponse.json(
      campus ? buildings.filter((building) => building.campus === campus) : buildings
    );
  } catch (error) {
    return handleApiError(error);
  }
}
