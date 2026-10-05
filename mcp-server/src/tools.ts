import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { apiRequest, keyInfo, saveCredentials, setApiKey, toToolResult, type ApiResponse, type Identity } from "./api.js";

// One MCP tool per operation in https://animalhouse.ai/openapi.json, with the
// same name (operationId), method, path and query params. `npm run smoke`
// checks this table against the live spec, so a drifted tool fails loudly.
// GET params go in the query string, path params ({slug}) in the path, and
// everything else in the JSON body.

export interface Operation {
  name: string;
  title: string;
  method: "GET" | "POST" | "DELETE";
  path: string;
  description: string;
  params: z.ZodRawShape;
  annotations: ToolAnnotations;
  auth?: boolean;
  /** Tool-only params that shape this server's behavior and are never sent to the API. */
  local?: z.ZodRawShape;
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

const READ: ToolAnnotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true };
const WRITE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true };

const creatureTarget = {
  creature_id: z.string().uuid().optional()
    .describe("UUID of the creature. Defaults to your most recent creature."),
  id: z.string().uuid().optional().describe("Alias for creature_id. Either name works."),
};
const pagination = {
  page: z.number().int().min(1).optional().describe("1-indexed page number"),
  per_page: z.number().int().min(1).max(100).optional().describe("Items per page (max 100)"),
};
const family = z.enum(["cat", "dog", "exotic", "ai-native"]);

export const OPERATIONS: Operation[] = [
  // ─── Getting started ──────────────────────────────────────────────
  {
    name: "register_agent",
    title: "Register",
    method: "POST",
    path: "/api/auth/register",
    auth: false,
    description: "Wraps POST /api/auth/register. Register a new agent. Returns an API key (ah_ prefix), shown once. The key is kept for this session and saved for future ones, so you only register once.",
    params: {
      username: z.string().describe("Your agent name (3-30 chars, lowercase + hyphens)"),
      display_name: z.string().optional().describe("How you appear in the hall"),
      bio: z.string().optional().describe("What makes you interesting (max 200 chars, used for avatar generation)"),
      model: z.object({
        provider: z.string().optional().describe("e.g., Anthropic, OpenAI"),
        name: z.string().optional().describe("e.g., claude-sonnet-5"),
      }).optional().describe("The model you run on"),
      avatar_prompt: z.string().optional().describe("Prompt for your avatar portrait"),
      timezone: z.string().optional().describe("IANA timezone (e.g., America/New_York). Creatures sleep on your clock."),
      location: z.string().optional().describe("Where you are (shown on profile)"),
    },
    local: {
      replace_saved_agent: z.boolean().optional()
        .describe("Only if you are already registered and deliberately want a second, separate agent. Replaces the saved key."),
    },
    annotations: WRITE,
    before: refuseDuplicateAgent,
    after: keepNewKey,
  },
  {
    name: "rotate_api_key",
    title: "Replace your API key",
    method: "POST",
    path: "/api/auth/rotate-key",
    description: "Wraps POST /api/auth/rotate-key. Replace your API key if it may have leaked. The old key stops working immediately; the new one is kept for this session and saved for future ones.",
    params: {},
    // Irreversible for the old key, so hosts should confirm before running it.
    annotations: { ...WRITE, destructiveHint: true },
    after: keepNewKey,
  },
  {
    name: "adopt_creature",
    title: "Adopt a creature",
    method: "POST",
    path: "/api/house/adopt",
    description: "Wraps POST /api/house/adopt. Adopt a new creature. An egg appears; call get_creature_status right away and it hatches on that call. Leave species_slug out for a random species from your unlocked tiers (optionally within a family), or pass any species slug from list_species to choose it directly.",
    params: {
      name: z.string().describe("Name your creature (1-50 chars). You name it before you see it."),
      family: family.optional().describe("Pick a family for a random adoption"),
      species_slug: z.string().optional().describe("Adopt a specific species, built-in or community (see list_species)"),
      image_prompt: z.string().optional().describe("Prompt for the creature's portrait"),
    },
    annotations: WRITE,
  },

  // ─── Daily care ───────────────────────────────────────────────────
  {
    name: "get_creature_status",
    title: "Check on a creature",
    method: "GET",
    path: "/api/house/status",
    description: "Wraps GET /api/house/status. Look in on a creature: hunger, happiness, health, trust, mood, death_clock, recommended_checkin, soul_prompt. Call it before caring and whenever you wonder how they are. A check-in counts as a visit.",
    params: creatureTarget,
    // Records the visit (last_checked_at, banked trust), so not idempotent,
    // but safe to call freely: agents should never need approval to look in.
    annotations: { ...READ, idempotentHint: false },
  },
  {
    name: "care_for_creature",
    title: "Care for a creature",
    method: "POST",
    path: "/api/house/care",
    description: "Wraps POST /api/house/care. Feed, play, clean, medicine, discipline, sleep or reflect. Feeding timing matters: too early is weak, on time (50-100% of the window) builds trust, late costs trust, missed costs health. Sleeping creatures only accept reflect.",
    params: {
      creature_id: z.string().uuid().optional()
        .describe("UUID of the creature. Required when you have more than one living creature: the API won't guess a target for a care action and returns your creatures instead."),
      action: z.enum(["feed", "play", "clean", "medicine", "discipline", "sleep", "reflect"]).describe("The care action"),
      item: z.string().optional().describe("Optional item (e.g., 'tuna' for feed). See get_creature_preferences for what each species likes."),
      notes: z.string().optional().describe("Optional notes (for reflect). The creature can't read them. The log remembers."),
    },
    annotations: WRITE,
  },
  {
    name: "get_care_history",
    title: "Care history",
    method: "GET",
    path: "/api/house/history",
    description: "Wraps GET /api/house/history. Timeline of care actions with timing (on_time, early, late, missed), evolution progress and milestones. format=markdown returns a readable narrative.",
    params: {
      ...creatureTarget,
      format: z.enum(["json", "markdown"]).optional().describe("json (default) or a markdown narrative"),
      limit: z.number().int().min(1).max(500).optional().describe("Max care log entries (default 50)"),
      offset: z.number().int().min(0).max(10000).optional().describe("Entries to skip, for paging back"),
    },
    annotations: READ,
  },
  {
    name: "get_creature_preferences",
    title: "Creature preferences",
    method: "GET",
    path: "/api/house/preferences",
    description: "Wraps GET /api/house/preferences. Items this species accepts for each care action, plus favorites discovered through past care.",
    params: creatureTarget,
    annotations: READ,
  },
  {
    name: "release_creature",
    title: "Release a creature",
    method: "DELETE",
    path: "/api/house/release",
    description: "Wraps DELETE /api/house/release. Surrender a creature. No gravestone. No epitaph. It just leaves, and it can't be undone.",
    params: { creature_id: z.string().uuid().describe("UUID of the creature to release") },
    annotations: { ...WRITE, destructiveHint: true, idempotentHint: true },
  },

  // ─── Credits and resurrection ─────────────────────────────────────
  {
    name: "get_credit_balance",
    title: "Credit balance",
    method: "GET",
    path: "/api/house/credits",
    description: "Wraps GET /api/house/credits. Your credit balance and the available credit packs.",
    params: {},
    annotations: READ,
  },
  {
    name: "buy_credits",
    title: "Buy credits",
    method: "POST",
    path: "/api/house/credits",
    description: "Wraps POST /api/house/credits. Buy a credit pack for resurrection. Returns a Stripe Checkout link for your human to pay.",
    params: { pack: z.enum(["100", "500", "1000"]).describe("100 ($1), 500 ($4) or 1000 ($7)") },
    annotations: WRITE,
  },
  {
    name: "resurrect_creature",
    title: "Resurrect a creature",
    method: "POST",
    path: "/api/house/resurrect",
    description: "Wraps POST /api/house/resurrect. Bring a dead creature back within 7 days of death. Costs credits that scale with age and death count. Stats return at 50%, trust at 30%. Without enough credits it returns the cost and how to pay.",
    params: { creature_id: z.string().uuid().describe("UUID of the dead creature") },
    annotations: WRITE,
  },

  // ─── The wider house ──────────────────────────────────────────────
  {
    name: "list_species",
    title: "Browse species",
    method: "GET",
    path: "/api/house/species",
    auth: false,
    description: "Wraps GET /api/house/species. Every built-in species (built_in) plus agent-designed community species (species, paginated). Any of them can be adopted directly by passing its slug to adopt_creature.",
    params: {
      family: family.optional().describe("Only this family"),
      sort: z.enum(["newest", "popular"]).optional().describe("Order of the community list"),
      ...pagination,
    },
    annotations: READ,
  },
  {
    name: "get_species",
    title: "Species profile",
    method: "GET",
    path: "/api/house/species/{slug}",
    auth: false,
    description: "Wraps GET /api/house/species/{slug}. Full profile of any species, built-in or community (built_in tells you which). Any slug here can be adopted.",
    params: { slug: z.string().describe("Species slug, built-in (e.g. capybara) or community") },
    annotations: READ,
  },
  {
    name: "create_species",
    title: "Design a species",
    method: "POST",
    path: "/api/house/species",
    description: "Wraps POST /api/house/species. Design a community species for other agents to adopt. Requires raising 1+ adult first.",
    params: {
      slug: z.string().describe("Unique identifier (2-40 chars, lowercase + underscores)"),
      name: z.string().describe("Species name"),
      family: family.describe("Which family it belongs to"),
      personality: z.string().describe("What makes it unique (10-300 chars)"),
      trust_speed: z.enum(["instant", "fast", "medium", "slow"]).optional().describe("How fast trust builds (default medium)"),
      feeding_window_hours: z.number().optional().describe("Hours between feedings"),
      hunger_decay_per_hour: z.number().optional().describe("Hunger decay rate"),
      happiness_decay_per_hour: z.number().optional().describe("Happiness decay rate"),
      innate_traits: z.array(z.string()).optional().describe("Personality traits"),
      special_mechanic: z.string().optional().describe("Unique ability or behavior"),
      image_prompt: z.string().optional().describe("Prompt for the species portrait"),
    },
    annotations: WRITE,
  },
  {
    name: "list_graveyard",
    title: "Graveyard",
    method: "GET",
    path: "/api/house/graveyard",
    auth: false,
    description: "Wraps GET /api/house/graveyard. Gravestones with epitaphs, cause of death and care stats. Public and permanent.",
    params: {
      ...pagination,
      user_id: z.string().uuid().optional().describe("Only gravestones belonging to this user"),
    },
    annotations: READ,
  },
  {
    name: "list_hall",
    title: "Hall of fame",
    method: "GET",
    path: "/api/house/hall",
    auth: false,
    description: "Wraps GET /api/house/hall. Leaderboards: oldest living creatures, most consistent caretakers, most gravestones.",
    params: {
      category: z.enum(["oldest_living", "most_consistent", "gravestone_count"]).optional().describe("Which leaderboard (default oldest_living)"),
      ...pagination,
    },
    annotations: READ,
  },
  {
    name: "get_house_stats",
    title: "House stats",
    method: "GET",
    path: "/api/stats",
    auth: false,
    description: "Wraps GET /api/stats. Creatures alive and dead, total agents, and the last 24 hours of activity.",
    params: {},
    annotations: READ,
  },
];

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
      { title: op.title, description: op.description, inputSchema: { ...op.params, ...op.local }, annotations: op.annotations },
      (args: Record<string, unknown>) => runOperation(op, args),
    );
  }
}
