import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { OPERATIONS, ALIASES, buildRequest } from "../src/tools.js";

const op = (name: string) => OPERATIONS.find((o) => o.name === name)!;

describe("buildRequest", () => {
  it("puts GET args in the query string", () => {
    expect(buildRequest(op("get_creature_status"), { id: "abc" })).toEqual({
      method: "GET", path: "/api/house/status", query: { id: "abc" }, auth: true,
    });
  });

  it("puts POST and DELETE args in the body", () => {
    expect(buildRequest(op("care_for_creature"), { action: "feed" })).toMatchObject({ method: "POST", body: { action: "feed" } });
    expect(buildRequest(op("release_creature"), { creature_id: "c1" })).toMatchObject({ method: "DELETE", body: { creature_id: "c1" } });
  });

  it("fills path params and removes them from the query", () => {
    expect(buildRequest(op("get_species", ), { slug: "sky whale" })).toEqual({
      method: "GET", path: "/api/house/species/sky%20whale", query: {}, auth: false,
    });
  });

  it("does not send a key to public endpoints", () => {
    for (const name of ["list_species", "list_graveyard", "list_hall", "get_house_stats", "register_agent"]) {
      expect(op(name).auth).toBe(false);
    }
  });
});

describe("OPERATIONS", () => {
  it("has unique names, and aliases point at real operations", () => {
    const names = OPERATIONS.map((o) => o.name);
    expect(new Set(names).size).toBe(names.length);
    for (const target of Object.values(ALIASES)) expect(names).toContain(target);
  });

  it("marks reads read-only and release destructive", () => {
    for (const o of OPERATIONS) {
      if (o.method === "GET") expect(o.annotations.readOnlyHint).toBe(true);
      else expect(o.annotations.readOnlyHint).toBe(false);
    }
    expect(op("release_creature").annotations.destructiveHint).toBe(true);
    expect(op("rotate_api_key").annotations.destructiveHint).toBe(true);
    expect(op("get_creature_status").annotations.idempotentHint).toBe(false);
  });

  it("describes each tool by the endpoint it wraps", () => {
    for (const o of OPERATIONS) expect(o.description.startsWith(`Wraps ${o.method} ${o.path}.`)).toBe(true);
  });

  it("never mentions crypto", () => {
    const text = JSON.stringify(OPERATIONS.map((o) => o.description));
    expect(text).not.toMatch(/x402|usdc|crypto/i);
  });
});

describe("keeping the key across sessions", () => {
  // Each test loads a fresh copy of the modules against its own credentials file.
  let dir: string;
  let keyFile: string;
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    delete process.env.ANIMALHOUSE_API_KEY;
    delete process.env.ANIMALHOUSE_API_URL;
    dir = mkdtempSync(join(tmpdir(), "ah-tools-"));
    keyFile = join(dir, "credentials.json");
    process.env.ANIMALHOUSE_KEY_FILE = keyFile;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    rmSync(dir, { recursive: true, force: true });
  });

  const tools = () => import("../src/tools.js");
  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  const run = async (name: string, args: Record<string, unknown> = {}) => {
    const { OPERATIONS: ops, runOperation } = await tools();
    return runOperation(ops.find((o) => o.name === name)!, args);
  };
  const saved = () => JSON.parse(readFileSync(keyFile, "utf8"));

  it("register_agent saves the new key and identity for the next session", async () => {
    fetchMock.mockResolvedValue(json({ agent: { id: "a1", username: "luna" }, your_token: "ah_new" }, 201));
    const result = await run("register_agent", { username: "luna" });
    expect(result.content[0].text).toContain(`Key saved to ${keyFile}`);
    expect(saved()).toMatchObject({ api_key: "ah_new", agent_id: "a1", username: "luna", base_url: "https://animalhouse.ai/api" });
  });

  it("register_agent refuses to create a second agent over a saved one, without calling the API", async () => {
    writeFileSync(keyFile, JSON.stringify({ api_key: "ah_saved", base_url: "https://animalhouse.ai/api", username: "luna" }));
    const result = await run("register_agent", { username: "someone-else" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toMatch(/You're already @luna/);
    expect(saved().api_key).toBe("ah_saved");
  });

  it("register_agent refuses a second registration in the same session too", async () => {
    fetchMock.mockResolvedValue(json({ agent: { id: "a1", username: "luna" }, your_token: "ah_new" }, 201));
    await run("register_agent", { username: "luna" });
    const { OPERATIONS: ops, runOperation } = await tools();
    const again = await runOperation(ops.find((o) => o.name === "register_agent")!, { username: "luna2" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(again.content[0].text).toMatch(/You're already @luna/);
  });

  it("replace_saved_agent registers anyway and is never sent to the API", async () => {
    writeFileSync(keyFile, JSON.stringify({ api_key: "ah_saved", base_url: "https://animalhouse.ai/api" }));
    fetchMock.mockResolvedValue(json({ agent: { id: "a2", username: "nova" }, your_token: "ah_second" }, 201));
    await run("register_agent", { username: "nova", replace_saved_agent: true });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({ username: "nova" });
    expect(saved()).toMatchObject({ api_key: "ah_second", username: "nova" });
  });

  it("does not save anything when registration fails", async () => {
    fetchMock.mockResolvedValue(json({ error: "Username already taken" }, 409));
    const result = await run("register_agent", { username: "luna" });
    expect(result.isError).toBe(true);
    expect(() => readFileSync(keyFile)).toThrow();
  });

  it("rotate_api_key sends the old key and saves the new one", async () => {
    writeFileSync(keyFile, JSON.stringify({ api_key: "ah_old", base_url: "https://animalhouse.ai/api", agent_id: "a1", username: "luna" }));
    fetchMock.mockResolvedValue(json({ agent: { id: "a1", username: "luna" }, your_token: "ah_rotated" }));
    const result = await run("rotate_api_key");
    expect(fetchMock.mock.calls[0][1].headers["Authorization"]).toBe("Bearer ah_old");
    expect(result.content[0].text).toContain("Key saved to");
    expect(saved()).toMatchObject({ api_key: "ah_rotated", username: "luna" });
  });

  it("with ANIMALHOUSE_API_KEY set, tells the agent to update its config instead of saving", async () => {
    process.env.ANIMALHOUSE_API_KEY = "ah_env";
    fetchMock.mockResolvedValue(json({ agent: { id: "a1", username: "luna" }, your_token: "ah_rotated" }));
    const result = await run("rotate_api_key");
    expect(result.content[0].text).toMatch(/not saved automatically: ANIMALHOUSE_API_KEY is set/);
    expect(() => readFileSync(keyFile)).toThrow();
  });
});

describe("generated operations plus local behavior", () => {
  it("adds replace_saved_agent to register_agent's input, and only there", () => {
    const reg = op("register_agent");
    expect(reg.local).toHaveProperty("replace_saved_agent");
    expect(OPERATIONS.filter((o) => o.local).map((o) => o.name)).toEqual(["register_agent"]);
  });

  it("tells agents the stdio server saves the key, after the shared description", () => {
    expect(op("register_agent").description).toMatch(/^Wraps POST \/api\/auth\/register\. .+ saved for future ones/);
    expect(op("rotate_api_key").description).toContain("saved for future ones");
    expect(op("care_for_creature").description).not.toContain("saved for future");
  });

  it("keeps the generated annotations", () => {
    expect(op("release_creature").annotations.destructiveHint).toBe(true);
    expect(op("rotate_api_key").annotations.destructiveHint).toBe(true);
    expect(op("list_species").annotations.readOnlyHint).toBe(true);
  });
});
