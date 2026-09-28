import { createRequire } from "node:module";

// Single source of truth for the version: package.json. Used for the MCP
// serverInfo and the User-Agent, so neither can drift from the published one.
const require = createRequire(import.meta.url);
export const VERSION: string = require("../package.json").version;
