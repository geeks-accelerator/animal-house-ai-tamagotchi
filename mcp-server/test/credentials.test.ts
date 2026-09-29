import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, statSync, writeFileSync, chmodSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { credentialsPath, readCredentials, writeCredentials } from "../src/credentials.js";

const PROD = "https://animalhouse.ai/api";
const dirs: string[] = [];
const tempDir = () => {
  const d = mkdtempSync(join(tmpdir(), "ah-cred-"));
  dirs.push(d);
  return d;
};
afterEach(() => { while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true }); });

describe("credentialsPath", () => {
  it("follows the documented order", () => {
    expect(credentialsPath({ ANIMALHOUSE_KEY_FILE: "/x/key.json", PLUGIN_DATA: "/p", XDG_CONFIG_HOME: "/c" })).toBe("/x/key.json");
    expect(credentialsPath({ PLUGIN_DATA: "/p", XDG_CONFIG_HOME: "/c" })).toBe(join("/p", "credentials.json"));
    expect(credentialsPath({ XDG_CONFIG_HOME: "/c" })).toBe(join("/c", "animalhouse", "credentials.json"));
    expect(credentialsPath({})).toBe(join(homedir(), ".config", "animalhouse", "credentials.json"));
  });

  it("ignores Claude Code's CLAUDE_PLUGIN_DATA, which is deleted on uninstall", () => {
    expect(credentialsPath({ CLAUDE_PLUGIN_DATA: "/claude" })).toBe(join(homedir(), ".config", "animalhouse", "credentials.json"));
  });

  it("treats blank values as unset", () => {
    expect(credentialsPath({ ANIMALHOUSE_KEY_FILE: " ", PLUGIN_DATA: "", XDG_CONFIG_HOME: "/c" })).toBe(join("/c", "animalhouse", "credentials.json"));
  });
});

describe("readCredentials", () => {
  const write = (body: string) => {
    const file = join(tempDir(), "credentials.json");
    writeFileSync(file, body);
    return file;
  };

  it("returns none when there is no file or no path", () => {
    expect(readCredentials(join(tempDir(), "missing.json"), PROD)).toEqual({ kind: "none" });
    expect(readCredentials(null, PROD)).toEqual({ kind: "none" });
  });

  it("accepts a key saved for this API, ignoring a trailing slash", () => {
    const file = write(JSON.stringify({ api_key: "ah_1", base_url: PROD + "/", saved_at: "t" }));
    expect(readCredentials(file, PROD)).toMatchObject({ kind: "ok", credentials: { api_key: "ah_1" } });
  });

  it("flags a key saved for a different API", () => {
    const file = write(JSON.stringify({ api_key: "ah_1", base_url: "http://localhost:3333/api" }));
    expect(readCredentials(file, PROD).kind).toBe("other_api");
  });

  it("rejects malformed files with a reason", () => {
    expect(readCredentials(write("{"), PROD)).toEqual({ kind: "unreadable", reason: "not valid JSON" });
    expect(readCredentials(write(JSON.stringify({ api_key: "nope", base_url: PROD })), PROD).kind).toBe("unreadable");
    expect(readCredentials(write(JSON.stringify({ api_key: "ah_1" })), PROD).kind).toBe("unreadable");
  });
});

describe("writeCredentials", () => {
  const creds = { api_key: "ah_1", base_url: PROD, saved_at: "t" };

  it("creates the directory 0700 and the file 0600", () => {
    const file = join(tempDir(), "nested", "animalhouse", "credentials.json");
    expect(writeCredentials(file, creds)).toBeNull();
    expect(readCredentials(file, PROD)).toMatchObject({ kind: "ok" });
    if (process.platform !== "win32") {
      expect(statSync(file).mode & 0o777).toBe(0o600);
      expect(statSync(join(file, "..")).mode & 0o777).toBe(0o700);
    }
  });

  it("tightens an existing file that was too open", () => {
    const file = join(tempDir(), "credentials.json");
    writeFileSync(file, "{}");
    chmodSync(file, 0o644);
    writeCredentials(file, creds);
    if (process.platform !== "win32") expect(statSync(file).mode & 0o777).toBe(0o600);
  });

  it("returns the error instead of throwing when it can't write", () => {
    const blocker = join(tempDir(), "a-file");
    writeFileSync(blocker, "");
    expect(writeCredentials(join(blocker, "credentials.json"), creds)).toMatch(/ENOTDIR|EEXIST/);
  });
});
