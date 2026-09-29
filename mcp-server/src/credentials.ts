// ─── Saved credentials ───────────────────────────────────────────────
//
// The key an agent gets from register_agent has to outlive the process, or
// the next session starts with no way back to its creatures and they die.
// It is saved to a small JSON file and read back on every start.
//
// Where the file lives, first match wins:
//   1. $ANIMALHOUSE_KEY_FILE                         explicit override
//   2. $PLUGIN_DATA/credentials.json                 per-plugin data dir (OpenClaw)
//   3. $XDG_CONFIG_HOME/animalhouse/credentials.json
//   4. ~/.config/animalhouse/credentials.json
//
// Claude Code's CLAUDE_PLUGIN_DATA is deliberately not used: it is deleted
// when the plugin is uninstalled, which would orphan the agent (and its pets)
// on a reinstall. The home file survives that and is shared by every host on
// the machine, so they all act as the same agent.
//
// The file is written 0600 in a 0700 directory, like ~/.npmrc. It is still
// plain text to anything running as this user; a leaked key can be replaced
// with the rotate_api_key tool.

import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface Credentials {
  api_key: string;
  /** The API base the key belongs to. A key is never sent anywhere else. */
  base_url: string;
  agent_id?: string;
  username?: string;
  saved_at: string;
}

export function credentialsPath(env: NodeJS.ProcessEnv = process.env): string | null {
  if (env.ANIMALHOUSE_KEY_FILE?.trim()) return env.ANIMALHOUSE_KEY_FILE.trim();
  if (env.PLUGIN_DATA?.trim()) return join(env.PLUGIN_DATA.trim(), "credentials.json");
  if (env.XDG_CONFIG_HOME?.trim()) return join(env.XDG_CONFIG_HOME.trim(), "animalhouse", "credentials.json");
  let home = "";
  try {
    home = homedir();
  } catch {
    // no home directory (some sandboxes): nowhere to save
  }
  return home ? join(home, ".config", "animalhouse", "credentials.json") : null;
}

/** Trailing slashes don't make a different host. */
const normalize = (url: string) => url.replace(/\/+$/, "");

export type ReadResult =
  | { kind: "none" }
  | { kind: "ok"; credentials: Credentials }
  /** The file holds a key for a different API. It is ignored, not sent. */
  | { kind: "other_api"; credentials: Credentials }
  | { kind: "unreadable"; reason: string };

export function readCredentials(path: string | null, baseUrl: string): ReadResult {
  if (!path) return { kind: "none" };
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === "ENOENT"
      ? { kind: "none" }
      : { kind: "unreadable", reason: (err as Error).message };
  }
  let parsed: Partial<Credentials>;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { kind: "unreadable", reason: "not valid JSON" };
  }
  if (typeof parsed.api_key !== "string" || !parsed.api_key.startsWith("ah_") || typeof parsed.base_url !== "string") {
    return { kind: "unreadable", reason: "missing api_key or base_url" };
  }
  const credentials = parsed as Credentials;
  return normalize(credentials.base_url) === normalize(baseUrl)
    ? { kind: "ok", credentials }
    : { kind: "other_api", credentials };
}

/** Write the file (0600, in a 0700 directory). Returns an error message, or null on success. */
export function writeCredentials(path: string, credentials: Credentials): string | null {
  try {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    // Write to a temp file and rename, so a crash mid-write can't leave a
    // truncated file where the only copy of the key used to be.
    const tmp = `${path}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(credentials, null, 2) + "\n", { mode: 0o600 });
    renameSync(tmp, path);
    // mode only applies when the file is created; tighten an existing one too.
    chmodSync(path, 0o600);
    return null;
  } catch (err) {
    return (err as Error).message;
  }
}
