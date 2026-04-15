#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools.js";
import { registerResources } from "./resources.js";
import { registerPrompts } from "./prompts.js";

const server = new McpServer({
  name: "animalhouse",
  version: "1.0.0",
});

// Register all capabilities
registerTools(server);
registerResources(server);
registerPrompts(server);

// Connect via stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
