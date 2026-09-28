import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  process.env.ANIMALHOUSE_API_KEY = "ah_test_key";
  delete process.env.ANIMALHOUSE_API_URL;
});
afterEach(() => vi.unstubAllGlobals());

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
