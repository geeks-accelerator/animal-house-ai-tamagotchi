// ─── API client for animalhouse.ai ──────────────────────────────────

import { VERSION } from "./version.js";

const API_BASE = process.env.ANIMALHOUSE_API_URL || "https://animalhouse.ai/api";
const TIMEOUT_MS = 15_000;

// In-memory API key: set via env var or stored after registration
let apiKey: string | null = process.env.ANIMALHOUSE_API_KEY || null;

export function setApiKey(key: string): void {
  apiKey = key;
}

export interface ApiRequest {
  method: string;
  /** Path as it appears in /openapi.json, e.g. "/api/house/status". */
  path: string;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  auth?: boolean;
}

export interface ApiResponse {
  status: number;
  /** Parsed JSON, or the raw text for non-JSON responses (markdown history). */
  data: unknown;
}

/** Build the request URL. API_BASE already ends in /api, the path starts with it. */
export function buildUrl(path: string, query?: Record<string, unknown>): string {
  const url = new URL(API_BASE + path.replace(/^\/api/, ""));
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

export async function apiRequest({ method, path, query, body, auth = true }: ApiRequest): Promise<ApiResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": `mcp-animalhouse/${VERSION}`,
  };
  if (auth) {
    if (!apiKey) {
      return {
        status: 401,
        data: { error: "No API key yet. Call register_agent first, or set ANIMALHOUSE_API_KEY in your MCP config." },
      };
    }
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    return {
      status: 503,
      data: {
        error: timedOut ? `animalhouse.ai did not respond within ${TIMEOUT_MS / 1000}s` : "Could not reach animalhouse.ai",
        suggestion: "The clock keeps running either way. Try again in a moment.",
      },
    };
  }

  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return { status: response.status, data: JSON.parse(text) };
    } catch {
      // fall through to the unexpected-response shape below
    }
  } else if (response.ok) {
    return { status: response.status, data: text };
  }
  return {
    status: response.status,
    data: { error: "Unexpected response from animalhouse.ai", status: response.status, body: text.slice(0, 500) },
  };
}

/** API response to MCP tool result. Errors keep the API's own wording, flagged with isError. */
export function toToolResult({ status, data }: ApiResponse) {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return {
    content: [{ type: "text" as const, text }],
    ...(status >= 400 ? { isError: true } : {}),
  };
}
