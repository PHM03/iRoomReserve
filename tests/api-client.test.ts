import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/configs/firebase", () => ({
  auth: {
    currentUser: null,
  },
}));

import { apiRequest } from "../lib/api/client";

describe("apiRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("preserves JSON error details on non-2xx responses", async () => {
    const responseBody = JSON.stringify({
      error: {
        message: "Reservation is already completed.",
      },
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(responseBody, {
          headers: {
            "Content-Type": "application/json",
          },
          status: 400,
        })
      )
    );

    await expect(
      apiRequest("/api/reservations/reservation-1", {
        method: "PATCH",
      })
    ).rejects.toMatchObject({
      contentType: "application/json",
      message: "Reservation is already completed.",
      responseBody,
      status: 400,
    });
  });

  it("falls back to the status code for HTML error responses", async () => {
    const responseBody = "<!DOCTYPE html><html><body>Server error</body></html>";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(responseBody, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
          status: 500,
        })
      )
    );

    await expect(
      apiRequest("/api/reservations/reservation-1", {
        method: "PATCH",
      })
    ).rejects.toMatchObject({
      contentType: "text/html; charset=utf-8",
      message: "The request failed (status 500).",
      responseBody,
      status: 500,
    });
  });
});
