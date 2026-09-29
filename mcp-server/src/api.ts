// ─── API client for animalhouse.ai ──────────────────────────────────

import { VERSION } from "./version.js";
import { credentialsPath, readCredentials, writeCredentials, type ReadResult } from "./credentials.js";

export const API_BASE = process.env.ANIMALHOUSE_API_URL || "https://animalhouse.ai/api";
const TIMEOUT_MS = 15_000;

// ─── The key ─────────────────────────────────────────────────────────
// First match wins: ANIMALHOUSE_API_KEY (explicit config; blank counts as
// unset, since an optional plugin setting left empty substitutes as ""),
// then the saved credentials file (see credentials.ts), then nothing until
// register_agent runs.

// A value that isn't an ah_ key is ignored rather than sent: a plugin host
// that doesn't substitute its settings can pass "${user_config.api_key}"
// through literally, and that must not shadow the saved key.
const envRaw = process.env.ANIMALHOUSE_API_KEY?.trim() || "";
const envKey = envRaw.startsWith("ah_") ? envRaw : null;
const envIgnored = envRaw !== "" && !envKey;
const keyFile = credentialsPath();
const saved: ReadResult = envKey ? { kind: "none" } : readCredentials(keyFile, API_BASE);

let apiKey: string | null = envKey ?? (saved.kind === "ok" ? saved.credentials.api_key : null);

export type KeySource = "env" | "file" | "session" | "none";
let keySource: KeySource = envKey ? "env" : saved.kind === "ok" ? "file" : "none";

export interface Identity { agent_id?: string; username?: string }
let identity: Identity = saved.kind === "ok"
  ? { agent_id: saved.credentials.agent_id, username: saved.credentials.username }
  : {};

export function setApiKey(key: string, who: Identity = {}): void {
  apiKey = key;
  keySource = "session";
  identity = { ...identity, ...who };
}

/** Where the current key came from and whose it is, as far as we know. */
export function keyInfo(): { source: KeySource; path: string | null; identity: Identity } {
  return { source: keySource, path: keyFile, identity };
}

/**
 * Save a key for future sessions. Returns where it went, or why it didn't.
 * Skipped when ANIMALHOUSE_API_KEY is set: that value wins on every start,
 * so a saved file would never be read.
 */
export function saveCredentials(key: { api_key: string; agent_id?: string; username?: string }):
  { saved: true; path: string } | { saved: false; reason: string } {
  if (envKey) return { saved: false, reason: "ANIMALHOUSE_API_KEY is set in your MCP config, and it wins on every start. Put the new key there." };
  if (!keyFile) return { saved: false, reason: "there is no home directory to save it in. Set ANIMALHOUSE_API_KEY in your MCP config." };
  const error = writeCredentials(keyFile, { ...key, base_url: API_BASE, saved_at: new Date().toISOString() });
  return error ? { saved: false, reason: `writing ${keyFile} failed (${error}). Set ANIMALHOUSE_API_KEY in your MCP config.` } : { saved: true, path: keyFile };
}

/** Why there's no key, for the error an agent sees. */
function missingKeyMessage(): string {
  if (envIgnored && saved.kind === "none") {
    return "No API key yet. ANIMALHOUSE_API_KEY is set, but it isn't an animalhouse.ai key (those start with ah_), so it was ignored. Fix it in your MCP config, or call register_agent.";
  }
  if (saved.kind === "other_api") {
    return `No API key for ${API_BASE}. The saved key in ${keyFile} belongs to ${saved.credentials.base_url}, so it isn't sent here. Call register_agent, or set ANIMALHOUSE_API_KEY.`;
  }
  if (saved.kind === "unreadable") {
    return `No API key yet. The saved credentials in ${keyFile} couldn't be read (${saved.reason}). Call register_agent, or set ANIMALHOUSE_API_KEY in your MCP config.`;
  }
  return "No API key yet. Call register_agent first, or set ANIMALHOUSE_API_KEY in your MCP config.";
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
        data: { error: missingKeyMessage() },
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
