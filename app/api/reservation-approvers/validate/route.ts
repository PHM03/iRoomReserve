import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { handleApiError } from "@/lib/server/api-error";
import { getRequestAuthContext } from "@/lib/server/request-auth";
import { assertAuthenticated } from "@/lib/server/route-guards";
import { reservationCampusSchema } from "@/lib/server/schemas";
import { validateReservationApprover } from "@/lib/server/services/reservations";

const validateApproverSchema = z.object({
  campus: reservationCampusSchema,
  email: z.string().trim().toLowerCase().email(),
});

function getErrorLogDetails(error: unknown) {
  if (error instanceof Error) {
    const errorWithCode = error as Error & { code?: unknown };

    return {
      error,
      message: error.message,
      code: errorWithCode.code,
      stack: error.stack,
    };
  }

  return {
    error,
    message: String(error),
    code: undefined,
    stack: undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getRequestAuthContext(request);
    assertAuthenticated(authContext);

    const payload = validateApproverSchema.parse(await request.json());
    const result = await validateReservationApprover(payload);

    return NextResponse.json({
      email: result.email,
      ok: true,
    });
  } catch (error) {
    console.error(
      "[API] POST /api/reservation-approvers/validate failed",
      getErrorLogDetails(error)
    );

    return handleApiError(error);
  }
}
