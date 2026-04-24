import { ApiError } from "./api-error";

export async function readJsonBody(request: Request): Promise<unknown> {
  if (!request.body) {
    throw new ApiError(400, "missing_body", "Request body is required.");
  }

  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");
  }
}
