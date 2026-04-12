import { NextRequest, NextResponse } from "next/server";

import { inferCampusFromBuilding } from "@/lib/campuses";
import { handleApiError } from "@/lib/server/api-error";
import { getOptionalAdminDb } from "@/lib/server/firebase-admin";
import { getRequestAuthContext } from "@/lib/server/request-auth";
import { assertAuthenticated } from "@/lib/server/route-guards";

interface BuildingRecord {
  id: string;
  name: string;
  code: string;
  address: string;
  floors: number;
  campus: "digi" | "main";
  assignedAdminUid: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const authContext = await getRequestAuthContext(request);
    assertAuthenticated(authContext);

    const { searchParams } = new URL(request.url);
    const campus = searchParams.get("campus");
    const adminDb = getOptionalAdminDb();

    if (!adminDb) {
      throw new Error(
        "Firebase Admin Firestore is not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY."
      );
    }

    const snapshot = await adminDb.collection("buildings").orderBy("name").get();
    const buildings: BuildingRecord[] = snapshot.docs.map((buildingDoc) => {
      const data = buildingDoc.data() as {
        name?: string;
        code?: string;
        address?: string;
        floors?: number;
        campus?: string | null;
        assignedAdminUid?: string | null;
      };

      return {
        id: buildingDoc.id,
        name: data.name ?? "",
        code: data.code ?? "",
        address: data.address ?? "",
        floors: data.floors ?? 0,
        campus:
          inferCampusFromBuilding({
            id: buildingDoc.id,
            code: data.code,
            name: data.name,
            campus: data.campus,
          }) ?? "main",
        assignedAdminUid: data.assignedAdminUid ?? null,
      };
    });

    return NextResponse.json(
      campus ? buildings.filter((building) => building.campus === campus) : buildings
    );
  } catch (error) {
    return handleApiError(error);
  }
}
