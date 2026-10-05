#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { registerTools } from "./tools.js";
import { registerPrompts } from "./prompts.js";
import { VERSION } from "./version.js";
import instructionsJson from "./instructions.json" with { type: "json" };

// Dual-era over stdio: a client that opens with the 2025 `initialize`
// handshake is served on that legacy revision; a 2026-07-28 client that
// sends per-request metadata (and server/discover) is served on the modern one.
serveStdio(() => {
  const server = new McpServer({ name: "animalhouse", version: VERSION }, { instructions: instructionsJson.instructions });
  registerTools(server);
  registerPrompts(server);
  return server;
});
