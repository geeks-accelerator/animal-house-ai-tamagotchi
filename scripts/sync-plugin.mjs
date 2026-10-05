#!/usr/bin/env node
// Generate every host manifest in plugin/ from plugin/plugin.source.json.
//
// One folder installs in Claude Code, Codex, Cursor and OpenClaw, and each
// reads its own manifest and MCP config shape. Hand-editing six files is how
// they drift, so they are generated, committed (marketplaces read them from
// GitHub), and checked in CI:
//
//   node scripts/sync-plugin.mjs           # write the generated files
//   node scripts/sync-plugin.mjs --check   # fail if any is out of date
//
// It also pins the MCP server to the exact version in mcp-server/package.json
// (a plugin version always means the same tools), and checks that every tool
// the plugin skills mention exists in mcp-server (operations.generated.ts).

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pluginDir = join(root, "plugin");
const check = process.argv.includes("--check");

const src = JSON.parse(readFileSync(join(pluginDir, "plugin.source.json"), "utf8"));
const serverVersion = JSON.parse(readFileSync(join(root, "mcp-server", "package.json"), "utf8")).version;
const serverArgs = ["-y", `${src.mcp.package}@${serverVersion}`];
const server = src.mcp.serverName;

const meta = {
  name: src.name,
  version: src.version,
  description: src.description,
  author: src.author,
  homepage: src.homepage,
  repository: src.repository,
  license: src.license,
  keywords: src.keywords,
};

const files = {
  // Claude Code. No userConfig for the key: Codex also reads this manifest's
  // MCP servers and does not substitute ${user_config.*}, so the literal
  // placeholder would reach the server and shadow a real ANIMALHOUSE_API_KEY
  // exported in the user's shell. Every host gets the same plain server; the
  // key comes from that env var or the saved credentials file.
  "plugin/.claude-plugin/plugin.json": {
    $schema: "https://json.schemastore.org/claude-code-plugin-manifest.json",
    ...meta,
    displayName: src.displayName,
  },
  // Claude layout's MCP file (Claude Code, and OpenClaw for Claude bundles).
  "plugin/.mcp.json": { mcpServers: { [server]: { command: "npx", args: serverArgs } } },

  // Agent Plugins portable format (Codex's preferred layout; OpenClaw reads it too).
  "plugin/plugin.json": { $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json", ...meta },
  "plugin/mcp.json": {
    $schema: "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
    mcpServers: { [server]: { type: "stdio", command: "npx", args: serverArgs } },
  },

  // OpenClaw native manifest. Repeats skills and MCP (the MeiGen pattern) so
  // the bundle works whichever way OpenClaw detects it.
  "plugin/openclaw.plugin.json": {
    id: src.name,
    name: src.displayName,
    description: src.description,
    version: src.version,
    // No "icon": ClawHub's server-side validator flags it as an unsupported
    // top-level field (manifest-unknown-fields, OpenClaw 2026.9.6), even
    // though the local inspector accepts it.
    skills: ["./skills"],
    configSchema: { type: "object", additionalProperties: false, properties: {} },
    mcpServers: { [server]: { transport: "stdio", command: "npx", args: serverArgs } },
  },

  // Cursor.
  "plugin/.cursor-plugin/plugin.json": {
    ...meta,
    displayName: src.displayName,
    logo: "assets/logo.svg",
    category: src.category,
    skills: "./skills/",
    mcpServers: "./.cursor-plugin/mcp.json",
  },
  "plugin/.cursor-plugin/mcp.json": { mcpServers: { [server]: { command: "npx", args: serverArgs } } },

  // Package metadata (clears ClawHub's package-json-missing check). Never
  // published to npm: ClawHub and the marketplaces distribute the folder.
  // No "openclaw" field: that marks a code plugin, and the inspector then
  // asks for a runtime entry point this content-only bundle doesn't have.
  "plugin/package.json": {
    name: src.name,
    version: src.version,
    private: true,
    description: src.description,
    homepage: src.homepage,
    repository: { type: "git", url: `git+${src.repository}.git`, directory: "plugin" },
    license: src.license,
    keywords: src.keywords,
  },

  // Marketplaces at the repo root, so users can add this repo by name.
  ".claude-plugin/marketplace.json": {
    name: src.marketplace.name,
    owner: { name: src.author.name, url: src.author.url },
    description: src.marketplace.description,
    plugins: [{ name: src.name, source: "./plugin", description: src.description, category: src.category }],
  },
  ".agents/plugins/marketplace.json": {
    name: src.marketplace.name,
    interface: { displayName: src.marketplace.displayName },
    plugins: [{
      name: src.name,
      source: { source: "local", path: "./plugin" },
      policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
    }],
  },
};

// ─── Skills may only name tools that exist ─────────────────────────────
// Tool names come from the generated table (one per OpenAPI operation) plus
// the aliases declared in tools.ts.
const generatedSrc = readFileSync(join(root, "mcp-server", "src", "operations.generated.ts"), "utf8");
const aliasSrc = readFileSync(join(root, "mcp-server", "src", "tools.ts"), "utf8");
const tools = new Set([
  ...[...generatedSrc.matchAll(/^    "name": "([a-z_]+)",$/gm)].map((m) => m[1]),
  ...[...(aliasSrc.match(/ALIASES[^{]*\{([^}]*)\}/)?.[1] ?? "").matchAll(/(\w+):/g)].map((m) => m[1]),
]);
const TOOL_LIKE = /`((?:register|adopt|get|care_for|release|buy|resurrect|list|create|rotate)_[a-z_]+)`/g;
const problems = [];
if (tools.size < 10) problems.push(`found only ${tools.size} tools in mcp-server/src/operations.generated.ts; the parser needs updating`);
for (const skill of readdirSync(join(pluginDir, "skills"))) {
  const file = join(pluginDir, "skills", skill, "SKILL.md");
  if (!existsSync(file)) continue;
  const text = readFileSync(file, "utf8");
  if (!new RegExp(`^---\\nname: ${skill}\\n`).test(text)) problems.push(`${relative(root, file)}: frontmatter name must be "${skill}"`);
  if (text.includes("—")) problems.push(`${relative(root, file)}: contains an em dash`);
  for (const [, name] of text.matchAll(TOOL_LIKE)) {
    if (!tools.has(name)) problems.push(`${relative(root, file)}: mentions \`${name}\`, which is not an MCP tool`);
  }
}

// ─── Write or check ────────────────────────────────────────────────────
const outputs = Object.entries(files).map(([path, body]) => [path, JSON.stringify(body, null, 2) + "\n"]);
// The bundle is published on its own, so it carries its own copy of the license.
outputs.push(["plugin/LICENSE", readFileSync(join(root, "LICENSE"), "utf8")]);

for (const [path, text] of outputs) {
  const full = join(root, path);
  const current = existsSync(full) ? readFileSync(full, "utf8") : null;
  if (current === text) continue;
  if (check) {
    problems.push(`${path} is out of date. Run: node scripts/sync-plugin.mjs`);
  } else {
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, text);
    console.log(`wrote ${path}`);
  }
}

if (problems.length) {
  console.error(`Plugin check failed:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log(`Plugin ${src.name}@${src.version} (${src.mcp.package}@${serverVersion}): ${check ? "up to date" : "synced"}.`);
