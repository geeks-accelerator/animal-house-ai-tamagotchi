import { fromJsonSchema, type McpServer } from "@modelcontextprotocol/server";
import { apiRequest, keyInfo, saveCredentials, setApiKey, toToolResult, type ApiResponse, type Identity } from "./api.js";
import { OPERATIONS as GENERATED } from "./operations.generated.js";
import type { GeneratedOperation } from "./operation-types.js";

// One MCP tool per operation in https://animalhouse.ai/openapi.json, generated
// into operations.generated.ts (npm run generate) from the API's own OpenAPI
// registry: name, method, path, description, input schema and annotations.
// This file only adds what is local to the stdio server: saving the key
// across sessions and refusing a duplicate registration. GET args go in the
// query string, path params ({slug}) in the path, everything else in the body.

export interface Operation extends GeneratedOperation {
  /** Tool-only params that shape this server's behavior and are never sent to the API. */
  local?: Record<string, object>;
  /** Runs before the API call. Returning text answers the call without making it. */
  before?: (args: Record<string, unknown>) => string | undefined;
  /** Runs after the API call. Returns text appended to the result. */
  after?: (response: ApiResponse) => string | undefined;
}

/**
 * After register_agent or rotate_api_key: keep the new key for this session
 * and save it for the next ones, then say which happened.
 */
function keepNewKey({ status, data }: ApiResponse): string | undefined {
  if (status >= 400) return undefined;
  const body = data as { your_token?: string; agent?: { id?: string; username?: string } } | null;
  const token = body?.your_token;
  if (!token) return undefined;
  const who: Identity = { agent_id: body?.agent?.id, username: body?.agent?.username };
  setApiKey(token, who);
  const result = saveCredentials({ api_key: token, ...who });
  if (result.saved) {
    return `\n\nKey saved to ${result.path} (readable only by your user), so future sessions come back as this agent automatically. ` +
      "It is also shown above, once. Keep a copy somewhere safe.";
  }
  return `\n\nSAVE THIS KEY. It won't be shown again, and it was not saved automatically: ${result.reason}\n` +
    `  "env": { "ANIMALHOUSE_API_KEY": "${token}" }`;
}

/** register_agent refuses to quietly create a second agent when one is already set up. */
function refuseDuplicateAgent(args: Record<string, unknown>): string | undefined {
  if (args.replace_saved_agent === true) return undefined;
  const { source, path, identity } = keyInfo();
  if (source === "none") return undefined;
  const who = identity.username ? `@${identity.username}` : "an agent";
  const where = source === "env" ? "ANIMALHOUSE_API_KEY in your MCP config"
    : source === "file" ? path : "this session";
  return `You're already ${who} (key from ${where}). Registering again would create a second agent, ` +
    "and the first agent's creatures would be left without their caretaker.\n\n" +
    "Your creatures are waiting: call get_creature_status.\n\n" +
    "To create a separate agent anyway, call register_agent again with replace_saved_agent: true. " +
    "The saved key is then replaced, so keep a copy of the current one first.";
}

// Tool names that aren't operationIds. Kept so older docs and skills keep working.
export const ALIASES: Record<string, string> = { register: "register_agent" };

/** What only this server does, attached to the generated operations by name. */
const LOCAL: Record<string, Pick<Operation, "local" | "before" | "after"> & { note?: string }> = {
  register_agent: {
    local: {
      replace_saved_agent: {
        type: "boolean",
        description: "Only if you are already registered and deliberately want a second, separate agent. Replaces the saved key.",
      },
    },
    before: refuseDuplicateAgent,
    after: keepNewKey,
    note: "The key is kept for this session and saved for future ones, so you only register once.",
  },
  rotate_api_key: {
    after: keepNewKey,
    note: "The new key is kept for this session and saved for future ones.",
  },
};

export const OPERATIONS: Operation[] = GENERATED.map((op) => {
  const local = LOCAL[op.name];
  if (!local) return op;
  const { note, ...hooks } = local;
  return { ...op, ...hooks, description: note ? `${op.description} ${note}` : op.description };
});

/** The tool's input schema: the generated one plus any local-only params. */
function inputSchemaFor(op: Operation) {
  if (!op.local) return op.inputSchema;
  const schema = op.inputSchema as { properties?: Record<string, object> };
  return { ...op.inputSchema, properties: { ...schema.properties, ...op.local } };
}

/** Split tool args into the path, query string or body, by method. */
export function buildRequest(op: Operation, args: Record<string, unknown>) {
  const rest = { ...args };
  const path = op.path.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = encodeURIComponent(String(rest[key] ?? ""));
    delete rest[key];
    return value;
  });
  return op.method === "GET"
    ? { method: op.method, path, query: rest, auth: op.auth ?? true }
    : { method: op.method, path, body: rest, auth: op.auth ?? true };
}

export async function runOperation(op: Operation, args: Record<string, unknown>) {
  const early = op.before?.(args);
  if (early) return { content: [{ type: "text" as const, text: early }] };
  const apiArgs = Object.fromEntries(Object.entries(args).filter(([key]) => !(key in (op.local ?? {}))));
  const response = await apiRequest(buildRequest(op, apiArgs));
  const result = toToolResult(response);
  const note = op.after?.(response);
  if (note) result.content[0].text += note;
  return result;
}

export function registerTools(server: McpServer) {
  const byName = new Map(OPERATIONS.map((op) => [op.name, op]));
  const entries: Array<[string, Operation]> = [
    ...OPERATIONS.map((op): [string, Operation] => [op.name, op]),
    ...Object.entries(ALIASES).map(([alias, target]): [string, Operation] => {
      const op = byName.get(target)!;
      return [alias, { ...op, description: `Alias for ${target}. ${op.description}` }];
    }),
  ];
  for (const [name, op] of entries) {
    server.registerTool(
      name,
      {
        title: op.title,
        description: op.description,
        inputSchema: fromJsonSchema<Record<string, unknown>>(inputSchemaFor(op)),
        annotations: op.annotations,
      },
      (args: Record<string, unknown>) => runOperation(op, args),
    );
  }
}
