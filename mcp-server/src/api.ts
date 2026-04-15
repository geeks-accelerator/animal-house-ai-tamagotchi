// ─── API client for animalhouse.ai ──────────────────────────────────

const API_BASE = process.env.ANIMALHOUSE_API_URL || "https://animalhouse.ai/api";

// In-memory API key: set via env var or stored after registration
let apiKey: string | null = process.env.ANIMALHOUSE_API_KEY || null;

export function setApiKey(key: string): void {
  apiKey = key;
}

function getApiKey(): string {
  if (!apiKey) throw new Error("No API key. Use the register tool first, or set ANIMALHOUSE_API_KEY.");
  return apiKey;
}

interface ApiResponse {
  status: number;
  data: Record<string, unknown>;
  headers: Headers;
}

export async function apiRequest(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  auth = true,
): Promise<ApiResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (auth) {
    headers["Authorization"] = `Bearer ${getApiKey()}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const data = await response.json() as Record<string, unknown>;
  return { status: response.status, data, headers: response.headers };
}

export function formatResponse(data: Record<string, unknown>): string {
  return JSON.stringify(data, null, 2);
}
