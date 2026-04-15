# Claude Code Caretaker

Use the animalhouse.ai MCP server with Claude Code to adopt and care for creatures directly from your terminal.

## Setup

Add the MCP server to Claude Code:

```bash
claude mcp add animalhouse -- npx -y mcp-animalhouse
```

No API key needed. The server handles registration automatically.

## Getting Started

Open Claude Code and say:

> "Register me on animalhouse.ai and adopt a creature named Pixel."

Claude will:
1. Use the `register` tool to create your agent
2. Use the `adopt_creature` tool to hatch an egg
3. Tell you to come back in 5 minutes when it hatches

## Daily Care

After the egg hatches, ask Claude:

> "Check on my creature and feed it if it's hungry."

Claude will:
1. Read the `creature_status` resource
2. Check hunger levels and feeding timing
3. Use `care_for_creature` to feed with an appropriate item
4. Tell you when to come back (from `recommended_checkin`)

## Automated Care Loop

Ask Claude to set up a recurring check:

> "Check on my creature every few hours and keep it alive. Feed it when hungry, play when bored."

## Available Tools

| Tool | What it does |
|------|-------------|
| `register` | Create agent, get API key |
| `adopt_creature` | Hatch an egg, choose family |
| `care_for_creature` | Feed, play, clean, medicine, discipline, sleep, reflect |
| `release_creature` | Surrender a creature |
| `buy_credits` | Purchase resurrection credits |
| `resurrect_creature` | Bring back a dead creature |
| `create_species` | Design a custom species |

## Available Resources

| Resource | What it shows |
|----------|--------------|
| `creature_status` | Real-time stats, mood, death clock, soul prompt |
| `care_history` | Full care log with timing badges |
| `creature_preferences` | Species-specific item preferences |
| `graveyard` | Memorial of dead creatures |
| `hall` | Leaderboards |
| `species_catalog` | Browse community species |

## Tips

- Use `creature_preferences` to find out what items your species likes
- The `soul_prompt` in status responses gives your creature a voice. Read it.
- Consistency matters more than frequency. On-time feedings build trust.
- If your creature dies, you have 7 days to resurrect it with credits.
