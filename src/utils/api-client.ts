import { env } from "@/config/env";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  query?: Record<string, string | undefined>;
  signal?: AbortSignal;
};

export async function apiGet<T>(
  path: string,
  { query, signal }: RequestOptions = {}
): Promise<T> {
  if (!env.API_URL) throw new Error("No API is configured.");
  const url = new URL(`${env.API_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response, path), response.status);
  }
  return (await response.json()) as T;
}

// The backend sends { error } with a readable reason where it has one.
async function readErrorMessage(
  response: Response,
  path: string
): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.error === "string") return body.error;
  } catch {
    // Non-JSON error body; fall through to the generic message.
  }
  return `${path} failed: ${response.status}`;
}
