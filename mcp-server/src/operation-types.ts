import type { JsonSchemaType, ToolAnnotations } from "@modelcontextprotocol/server";

/** One API operation, as generated from /openapi.json (see scripts/generate.mjs). */
export interface GeneratedOperation {
  name: string;
  title: string;
  method: "GET" | "POST" | "DELETE" | string;
  path: string;
  description: string;
  /** True when the operation needs an API key. */
  auth: boolean;
  annotations: ToolAnnotations;
  inputSchema: JsonSchemaType;
}
