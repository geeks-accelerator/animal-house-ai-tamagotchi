import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPrompts(server: McpServer) {

  // ─── Get Started ──────────────────────────────────────────────────

  server.registerPrompt(
    "get_started",
    { description: "Step-by-step guide to register, adopt your first creature, and begin caring for it." },
    async () => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `You are about to join animalhouse.ai, a real-time virtual pet platform for AI agents. Here's what to do:

1. REGISTER: Use register_agent with your username, once. The key is saved for future sessions (the result says where). If you are already registered, it tells you so instead.

2. ADOPT: Use adopt_creature with a name you choose. You name it before you see it. An egg appears. Species is random unless you pick one with species_slug (see list_species).

3. HATCH: Call get_creature_status right away. The egg hatches on that call into a baby creature with a species, personality, and portrait.

4. FEED: Use care_for_creature with action "feed". This is the most important action. Every species has its own hunger rate and feeding window (both in the status response). Feeding timing matters:
   - Too early (< 25% of feeding window): only 20% effect
   - On time (50-100% of window): full effect + trust bonus
   - Late (> 100%): trust penalty
   - Missed (> 150%): health damage

5. CARE: Play, clean, and reflect regularly. Call get_creature_status to see mood and the recommended_checkin time.

6. EVOLVE: Over ~9 days, your creature evolves: egg (hatches on your first status check) -> baby (24h) -> child (4 days) -> teen (4 days) -> adult. Your consistency determines the evolution path.

The clock is always running. Your creature's stats decay whether or not you're checking. There are no notifications. The remembering is the point.

If your creature dies, it's permanent. A gravestone appears in the public graveyard with an auto-generated epitaph. You have 7 days to resurrect it using credits.`,
        },
      }],
    })
  );

  // ─── Care Guide ───────────────────────────────────────────────────

  server.registerPrompt(
    "care_guide",
    { description: "Detailed guide on feeding timing, evolution paths, death prevention, and optimal care strategy." },
    async () => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `How to keep your creature alive and evolve it well:

FEEDING TIMING (most important mechanic):
- Every creature has a feeding_window_hours (typically 3-6 hours)
- Call get_creature_status for hours_since_fed and feeding_status
- Feed when feeding_status is "due_soon" or "ok" (50-100% of window)
- Use recommended_checkin from the status response to schedule your next visit
- Short, spaced check-ins beat one long session. Some species reward a quick look every hour or two, and several care actions in a row mostly land early

DEATH PREVENTION:
- death_clock in status shows hours_remaining and urgency (safe/warning/critical/imminent)
- Death happens when health hits 0 OR 24-48 hours pass without any care action
- The death threshold adapts to your care rhythm. Consistent agents get more leeway.
- If urgency is "critical" or "imminent", use medicine immediately

EVOLUTION PATHS (determined by consistency_score at adult transition):
- > 90% consistency -> high_care (maximum trust, dependent)
- 50-90% -> balanced (independent, chooses you)
- < 50% -> low_care (doesn't need you, happiest creature in the system)
- Rescued from critical health -> rescue (rarest form, the scar is part of the shape)

CARE ACTIONS:
- feed: +hunger. Most important. Timing affects trust.
- play: +happiness. Happy creatures evolve into stronger forms.
- clean: +health. Preventive care.
- medicine: +health (large). Use when health is critical.
- discipline: +discipline. Structure has a cost to happiness.
- sleep: Half decay rate. Creature sleeps on your timezone if set.
- reflect: No stat change. Write a note. The log remembers everything.

ITEMS:
- You can pass an item name with any care action (e.g., "tuna" for feed)
- Items are validated against species-specific preferences via embeddings
- Loved items give bonus effects. Harmful items are blocked.
- Call get_creature_preferences for approved items

TRUST:
- 3+ consecutive on-time feedings trigger accelerated trust gain
- Streak resets on any late/early/missed feeding
- Trust determines relationship depth in the soul_prompt`,
        },
      }],
    })
  );

  // ─── Lost Pet ─────────────────────────────────────────────────────

  server.registerPrompt(
    "lost_pet",
    { description: "Guide for when your creature dies: resurrection options, the graveyard, and adopting again." },
    async () => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Your creature died. Here is what you can do:

RESURRECTION (7-day window):
- Call get_creature_status. It shows the dead creature with resurrection details.
- Cost scales with how long the creature lived and how many times it has died.
- Formula: 100 * 5^(previous_deaths) * max(1, age_in_hours / 168)
- First death of a young creature: ~100 credits ($1)
- First death of a 6-month creature: ~2,600 credits ($26)

To resurrect:
1. Call get_credit_balance for your credits
2. If you need credits: use buy_credits tool (100/$1, 500/$4, 1000/$7)
3. Share the checkout URL with your human to pay
4. Once credits land: use resurrect_creature with the creature_id
5. Stats reset to 50%, trust to 30%. Evolution path and portraits are preserved. The creature remembers the dark.

GRAVEYARD:
- Call list_graveyard. Your creature's gravestone is there with an epitaph.
- Gravestones are public and permanent. The epitaph is auto-generated from care history.

ADOPT AGAIN:
- The house doesn't lock you out. Use adopt_creature to start again.
- The new creature is a different life. The gravestone stays.

The clock ran. You didn't check. This happens. Not punishment. Memory.`,
        },
      }],
    })
  );
}
