// Smoke test, read-only (it never calls a tool):
// 1. src/operations.generated.ts matches the API's /openapi.json
// 2. the built stdio server lists one tool per operation (name = operationId,
//    same method, path and query params) plus the alias, and the 3 prompts
// 3. the hosted endpoint (<origin>/mcp) lists exactly the same tools
//
//   npm run smoke                                        # against prod
//   ANIMALHOUSE_API_URL=http://localhost:3333/api npm run smoke

import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiBase = process.env.ANIMALHOUSE_API_URL || "https://animalhouse.ai/api";
const specUrl = apiBase.replace(/\/api\/?$/, "") + "/openapi.json";
const ALIASES = { register: "register_agent" };
const EXPECTED_PROMPTS = ["get_started", "care_guide", "lost_pet"];

// ─── Talk to the server ────────────────────────────────────────────
const child = spawn(process.execPath, [join(root, "build/index.js")], { stdio: ["pipe", "pipe", "inherit"] });
const pending = new Map();
let buffer = "";
child.stdout.on("data", (chunk) => {
  buffer += chunk;
  let nl;
  while ((nl = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, nl);
    buffer = buffer.slice(nl + 1);
    if (!line.trim()) continue;
    const msg = JSON.parse(line);
    pending.get(msg.id)?.(msg);
  }
});
let nextId = 1;
const rpc = (method, params = {}) => new Promise((resolve, reject) => {
  const id = nextId++;
  const timer = setTimeout(() => reject(new Error(`${method} timed out`)), 10_000);
  pending.set(id, (msg) => { clearTimeout(timer); msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result); });
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
});

const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };

// ─── 1. The generated table is current ─────────────────────────────
try {
  execFileSync(process.execPath, [join(root, "scripts/generate.mjs"), "--check"], { stdio: "pipe", env: process.env });
} catch (err) {
  failures.push(String(err.stderr || err.message).trim());
}

// ─── 3. The hosted endpoint's tools (a legacy-era client, raw JSON-RPC) ──
async function hostedToolNames() {
  const mcpUrl = apiBase.replace(/\/api\/?$/, "") + "/mcp";
  const post = async (body) => {
    const res = await fetch(mcpUrl, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-11-25" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    const json = text.startsWith("{") ? text : text.split("\n").find((l) => l.startsWith("data: "))?.slice(6);
    return JSON.parse(json);
  };
  await post({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "smoke", version: "0" } } });
  const list = await post({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  return { mcpUrl, names: list.result.tools.map((t) => t.name).sort() };
}

try {
  const init = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "smoke", version: "0" } });
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  const { version } = JSON.parse(await import("node:fs").then((fs) => fs.readFileSync(join(root, "package.json"), "utf8")));
  check(init.serverInfo.version === version, `serverInfo.version is ${init.serverInfo.version}, package.json is ${version}`);

  const { tools } = await rpc("tools/list");
  const { prompts } = await rpc("prompts/list");
  check(JSON.stringify(prompts.map((p) => p.name).sort()) === JSON.stringify([...EXPECTED_PROMPTS].sort()),
    `prompts are ${prompts.map((p) => p.name).join(", ")}`);

  // ─── Compare with the API contract ───────────────────────────────
  const spec = await (await fetch(specUrl)).json();
  const operations = new Map();
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      const query = (op.parameters ?? []).filter((p) => p.in === "query").map((p) => p.name).sort();
      const pathParams = (op.parameters ?? []).filter((p) => p.in === "path").map((p) => p.name).sort();
      operations.set(op.operationId, { method: method.toUpperCase(), path, query, pathParams });
    }
  }

  const toolNames = tools.map((t) => t.name);
  for (const [alias, target] of Object.entries(ALIASES)) {
    check(toolNames.includes(alias), `alias ${alias} is missing`);
    check(toolNames.includes(target), `alias target ${target} is missing`);
  }
  const canonical = tools.filter((t) => !(t.name in ALIASES));
  for (const id of operations.keys()) check(canonical.some((t) => t.name === id), `no tool for operation ${id}`);

  for (const tool of canonical) {
    const op = operations.get(tool.name);
    if (!op) { failures.push(`tool ${tool.name} has no matching operationId in ${specUrl}`); continue; }
    const wraps = tool.description.match(/^Wraps (\w+) (\S+)\./);
    check(wraps && wraps[1] === op.method && wraps[2] === op.path,
      `${tool.name} says "${wraps?.slice(1).join(" ")}", spec says "${op.method} ${op.path}"`);
    if (op.method === "GET") {
      const params = Object.keys(tool.inputSchema.properties ?? {}).filter((p) => !op.pathParams.includes(p)).sort();
      check(JSON.stringify(params) === JSON.stringify(op.query),
        `${tool.name} params [${params}] vs spec query [${op.query}]`);
    }
  }

  const hosted = await hostedToolNames();
  const stdioNames = tools.map((t) => t.name).sort();
  check(JSON.stringify(hosted.names) === JSON.stringify(stdioNames),
    `hosted ${hosted.mcpUrl} lists [${hosted.names}] but stdio lists [${stdioNames}]`);

  console.log(`${tools.length} tools (${canonical.length} operations + ${tools.length - canonical.length} alias), ${prompts.length} prompts, checked against ${specUrl} and ${hosted.mcpUrl}`);
} catch (err) {
  failures.push(err.message);
} finally {
  child.kill();
}

if (failures.length) {
  console.error(`\nSmoke test failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("Smoke test passed.");
