import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const fetchMock = vi.fn();
let dir: string;
let keyFile: string;

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  process.env.ANIMALHOUSE_API_KEY = "ah_test_key";
  delete process.env.ANIMALHOUSE_API_URL;
  // Never touch the real ~/.config/animalhouse from a test.
  dir = mkdtempSync(join(tmpdir(), "ah-api-"));
  keyFile = join(dir, "credentials.json");
  process.env.ANIMALHOUSE_KEY_FILE = keyFile;
});
afterEach(() => {
  vi.unstubAllGlobals();
  rmSync(dir, { recursive: true, force: true });
});

const saveFile = (body: object) => writeFileSync(keyFile, JSON.stringify(body));

const load = () => import("../src/api.js");
const reply = (body: string, status = 200, type = "application/json") =>
  new Response(body, { status, headers: { "content-type": type } });

describe("apiRequest", () => {
  it("sends the mcp-animalhouse User-Agent with the package version and the bearer key", async () => {
    const { apiRequest } = await load();
    const { VERSION } = await import("../src/version.js");
    fetchMock.mockResolvedValue(reply("{}"));
    await apiRequest({ method: "GET", path: "/api/house/status" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://animalhouse.ai/api/house/status");
    expect(init.headers["User-Agent"]).toBe(`mcp-animalhouse/${VERSION}`);
    expect(init.headers["Authorization"]).toBe("Bearer ah_test_key");
  });

  it("parses JSON and passes the status through", async () => {
    const { apiRequest } = await load();
    fetchMock.mockResolvedValue(reply('{"error":"nope"}', 404));
    expect(await apiRequest({ method: "GET", path: "/api/house/status" })).toEqual({ status: 404, data: { error: "nope" } });
  });

  it("returns non-JSON success bodies as text (markdown history)", async () => {
    const { apiRequest } = await load();
    fetchMock.mockResolvedValue(reply("# Luna", 200, "text/markdown"));
    expect(await apiRequest({ method: "GET", path: "/api/house/history" })).toEqual({ status: 200, data: "# Luna" });
  });

  it("turns an HTML error page into a readable error instead of throwing", async () => {
    const { apiRequest } = await load();
    fetchMock.mockResolvedValue(reply("<html>Bad Gateway</html>", 502, "text/html"));
    const res = await apiRequest({ method: "GET", path: "/api/house/status" });
    expect(res.status).toBe(502);
    expect(res.data).toMatchObject({ error: "Unexpected response from animalhouse.ai", body: "<html>Bad Gateway</html>" });
  });

  it("reports a timeout as a 503 error instead of hanging", async () => {
    const { apiRequest } = await load();
    fetchMock.mockRejectedValue(Object.assign(new Error("timed out"), { name: "TimeoutError" }));
    const res = await apiRequest({ method: "GET", path: "/api/stats", auth: false });
    expect(res.status).toBe(503);
    expect((res.data as { error: string }).error).toMatch(/did not respond/);
  });

  it("asks for registration instead of calling the API when there is no key", async () => {
    delete process.env.ANIMALHOUSE_API_KEY;
    const { apiRequest } = await load();
    const res = await apiRequest({ method: "GET", path: "/api/house/status" });
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses a key stored after registration", async () => {
    delete process.env.ANIMALHOUSE_API_KEY;
    const { apiRequest, setApiKey } = await load();
    setApiKey("ah_new");
    fetchMock.mockResolvedValue(reply("{}"));
    await apiRequest({ method: "GET", path: "/api/house/history", query: { format: "markdown" } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://animalhouse.ai/api/house/history?format=markdown");
    expect(init.headers["Authorization"]).toBe("Bearer ah_new");
  });
});

describe("the key at startup", () => {
  const status = async () => {
    const { apiRequest } = await load();
    fetchMock.mockResolvedValue(reply("{}"));
    const res = await apiRequest({ method: "GET", path: "/api/house/status" });
    return { res, auth: fetchMock.mock.calls[0]?.[1].headers["Authorization"] };
  };

  it("reads the saved credentials when ANIMALHOUSE_API_KEY is blank", async () => {
    process.env.ANIMALHOUSE_API_KEY = "  ";
    saveFile({ api_key: "ah_saved", base_url: "https://animalhouse.ai/api", username: "luna" });
    expect((await status()).auth).toBe("Bearer ah_saved");
    const { keyInfo } = await load();
    expect(keyInfo()).toMatchObject({ source: "file", identity: { username: "luna" } });
  });

  it("ignores an ANIMALHOUSE_API_KEY that isn't an ah_ key, such as an unsubstituted plugin setting", async () => {
    process.env.ANIMALHOUSE_API_KEY = "${user_config.api_key}";
    saveFile({ api_key: "ah_saved", base_url: "https://animalhouse.ai/api" });
    expect((await status()).auth).toBe("Bearer ah_saved");
  });

  it("says why an invalid ANIMALHOUSE_API_KEY was ignored when nothing else is saved", async () => {
    process.env.ANIMALHOUSE_API_KEY = "not-a-key";
    const { res } = await status();
    expect(fetchMock).not.toHaveBeenCalled();
    expect((res.data as { error: string }).error).toMatch(/isn't an animalhouse.ai key/);
  });

  it("lets ANIMALHOUSE_API_KEY win over the saved file", async () => {
    saveFile({ api_key: "ah_saved", base_url: "https://animalhouse.ai/api" });
    expect((await status()).auth).toBe("Bearer ah_test_key");
  });

  it("never sends a key saved for a different API", async () => {
    delete process.env.ANIMALHOUSE_API_KEY;
    saveFile({ api_key: "ah_local", base_url: "http://localhost:3333/api" });
    const { res } = await status();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
    expect((res.data as { error: string }).error).toMatch(/belongs to http:\/\/localhost:3333\/api/);
  });

  it("explains an unreadable file instead of failing silently", async () => {
    delete process.env.ANIMALHOUSE_API_KEY;
    writeFileSync(keyFile, "{not json");
    const { res } = await status();
    expect((res.data as { error: string }).error).toMatch(/couldn't be read \(not valid JSON\)/);
  });
});

describe("saveCredentials", () => {
  it("writes the key with its base_url, readable only by the user", async () => {
    delete process.env.ANIMALHOUSE_API_KEY;
    const { saveCredentials } = await load();
    expect(saveCredentials({ api_key: "ah_new", agent_id: "a1", username: "luna" })).toEqual({ saved: true, path: keyFile });
    const saved = JSON.parse(readFileSync(keyFile, "utf8"));
    expect(saved).toMatchObject({ api_key: "ah_new", agent_id: "a1", username: "luna", base_url: "https://animalhouse.ai/api" });
    if (process.platform !== "win32") expect(statSync(keyFile).mode & 0o777).toBe(0o600);
  });

  it("does not save when ANIMALHOUSE_API_KEY is set, since that would win on the next start", async () => {
    const { saveCredentials } = await load();
    const result = saveCredentials({ api_key: "ah_new" });
    expect(result.saved).toBe(false);
    expect(() => readFileSync(keyFile)).toThrow();
  });
});

describe("buildUrl", () => {
  it("honors ANIMALHOUSE_API_URL and drops empty query values", async () => {
    process.env.ANIMALHOUSE_API_URL = "http://localhost:3333/api";
    const { buildUrl } = await load();
    expect(buildUrl("/api/stats", { a: 1, b: undefined, c: "" })).toBe("http://localhost:3333/api/stats?a=1");
  });
});

describe("toToolResult", () => {
  it("flags 4xx and 5xx as isError and keeps the API's own words", async () => {
    const { toToolResult } = await load();
    const err = toToolResult({ status: 400, data: { error: "creature_id (or id) is required" } });
    expect(err.isError).toBe(true);
    expect(err.content[0].text).toContain("creature_id (or id) is required");
    expect(toToolResult({ status: 200, data: { ok: true } }).isError).toBeUndefined();
    expect(toToolResult({ status: 200, data: "# md" }).content[0].text).toBe("# md");
  });
});
