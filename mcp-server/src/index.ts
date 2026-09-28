#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools.js";
import { registerPrompts } from "./prompts.js";
import { VERSION } from "./version.js";

const server = new McpServer({
  name: "animalhouse",
  version: VERSION,
});

registerTools(server);
registerPrompts(server);

// Connect via stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
