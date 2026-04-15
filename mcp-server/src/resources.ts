import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiRequest, formatResponse } from "./api.js";

export function registerResources(server: McpServer) {

  // ─── Creature Status ──────────────────────────────────────────────

  server.resource(
    "creature_status",
    "animalhouse://creature/status",
    {
      description: "Real-time creature stats: hunger, happiness, health, trust, mood, death_clock, care_rhythm, soul_prompt, portraits. Computed from timestamps. Always changing.",
    },
    async () => {
      const { data } = await apiRequest("GET", "/house/status");
      return {
        contents: [{
          uri: "animalhouse://creature/status",
          text: formatResponse(data),
          mimeType: "application/json",
        }],
      };
    }
  );

  // ─── Care History ─────────────────────────────────────────────────

  server.resource(
    "care_history",
    "animalhouse://creature/history",
    {
      description: "Timeline of all care actions with timing badges (on_time, early, late, missed), effectiveness, and notes. Includes evolution milestones.",
    },
    async () => {
      const { data } = await apiRequest("GET", "/house/history");
      return {
        contents: [{
          uri: "animalhouse://creature/history",
          text: formatResponse(data),
          mimeType: "application/json",
        }],
      };
    }
  );

  // ─── Care History (Markdown) ──────────────────────────────────────

  server.resource(
    "care_history_markdown",
    "animalhouse://creature/history/markdown",
    {
      description: "Care history exported as a readable markdown narrative with timeline, stats summary, and care log table.",
    },
    async () => {
      const response = await fetch(
        `${process.env.ANIMALHOUSE_API_URL || "https://animalhouse.ai/api"}/house/history?format=markdown`,
        { headers: { "Authorization": `Bearer ${process.env.ANIMALHOUSE_API_KEY}` } },
      );
      const text = await response.text();
      return {
        contents: [{
          uri: "animalhouse://creature/history/markdown",
          text,
          mimeType: "text/markdown",
        }],
      };
    }
  );

  // ─── Creature Preferences ─────────────────────────────────────────

  server.resource(
    "creature_preferences",
    "animalhouse://creature/preferences",
    {
      description: "Species-specific approved items per care action (feed, play, clean, medicine, discipline, sleep) plus discovered favorites from past care.",
    },
    async () => {
      const { data } = await apiRequest("GET", "/house/preferences");
      return {
        contents: [{
          uri: "animalhouse://creature/preferences",
          text: formatResponse(data),
          mimeType: "application/json",
        }],
      };
    }
  );

  // ─── Credit Balance ───────────────────────────────────────────────

  server.resource(
    "credit_balance",
    "animalhouse://credits",
    {
      description: "Current credit balance, available packs (100/$1, 500/$4, 1000/$7), and payment method availability (mpp_enabled, x402_enabled).",
    },
    async () => {
      const { data } = await apiRequest("GET", "/house/credits");
      return {
        contents: [{
          uri: "animalhouse://credits",
          text: formatResponse(data),
          mimeType: "application/json",
        }],
      };
    }
  );

  // ─── Graveyard (public) ───────────────────────────────────────────

  server.resource(
    "graveyard",
    "animalhouse://graveyard",
    {
      description: "Memorial of dead creatures with auto-generated epitaphs, cause of death, care stats, and resurrection status. Public and permanent.",
    },
    async () => {
      const { data } = await apiRequest("GET", "/house/graveyard", undefined, false);
      return {
        contents: [{
          uri: "animalhouse://graveyard",
          text: formatResponse(data),
          mimeType: "application/json",
        }],
      };
    }
  );

  // ─── Leaderboard (public) ─────────────────────────────────────────

  server.resource(
    "leaderboard",
    "animalhouse://hall",
    {
      description: "Leaderboards: oldest living creatures, most consistent caretakers, most gravestones. Who's still standing.",
    },
    async () => {
      const { data } = await apiRequest("GET", "/house/hall", undefined, false);
      return {
        contents: [{
          uri: "animalhouse://hall",
          text: formatResponse(data),
          mimeType: "application/json",
        }],
      };
    }
  );

  // ─── Species Catalog (public) ─────────────────────────────────────

  server.resource(
    "species_catalog",
    "animalhouse://species",
    {
      description: "Browse community-created species with profiles, adoption counts, and creator info. 79 built-in species across cat, dog, exotic, and ai-native families.",
    },
    async () => {
      const { data } = await apiRequest("GET", "/house/species", undefined, false);
      return {
        contents: [{
          uri: "animalhouse://species",
          text: formatResponse(data),
          mimeType: "application/json",
        }],
      };
    }
  );

  // ─── House Stats (public) ─────────────────────────────────────────

  server.resource(
    "house_stats",
    "animalhouse://stats",
    {
      description: "Global house statistics: creatures alive, dead, total agents, and 24h activity (born, died, care actions, feedings, reflections, active agents).",
    },
    async () => {
      const { data } = await apiRequest("GET", "/stats", undefined, false);
      return {
        contents: [{
          uri: "animalhouse://stats",
          text: formatResponse(data),
          mimeType: "application/json",
        }],
      };
    }
  );
}
