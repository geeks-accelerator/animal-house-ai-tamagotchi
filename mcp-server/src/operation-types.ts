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
  /**
   * What a successful reply looks like (N6). The API declares every field
   * optional and allows unknown keys, so declaring this cannot make a real
   * response invalid, which matters because the SDK enforces it: a successful
   * call with no structuredContent is a protocol error.
   */
  outputSchema: JsonSchemaType;
}
