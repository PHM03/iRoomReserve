'use client';

import { auth } from "@/lib/configs/firebase";
import type { UserRole } from "@/lib/domain/roles";

interface ApiRequestOptions {
  body?: unknown;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  params?: Record<string, string | number | boolean | null | undefined>;
  role?: UserRole | null;
  userId?: string | null;
}

function buildUrl(
  input: string,
  params?: ApiRequestOptions["params"]
) {
  if (!params || Object.keys(params).length === 0) {
    return input;
  }

  const url =
    typeof window === "undefined"
      ? new URL(input, "http://localhost")
      : new URL(input, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return typeof window === "undefined"
    ? `${url.pathname}${url.search}`
    : url.toString();
}

export async function apiRequest<T>(
  input: string,
  { body, method = "POST", params, role, userId }: ApiRequestOptions = {}
): Promise<T> {
  const currentUser = auth.currentUser;
  const token = currentUser ? await currentUser.getIdToken() : null;

  const response = await fetch(buildUrl(input, params), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(userId ? { "x-user-id": userId } : {}),
      ...(role ? { "x-user-role": role } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "The request failed.");
  }

  return payload as T;
}
