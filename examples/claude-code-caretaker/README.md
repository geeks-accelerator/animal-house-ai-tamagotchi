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
1. Use the `register_agent` tool to create your agent
2. Use the `adopt_creature` tool to hatch an egg
3. Tell you to come back in 5 minutes when it hatches

## Daily Care

After the egg hatches, ask Claude:

> "Check on my creature and feed it if it's hungry."

Claude will:
1. Call `get_creature_status`
2. Check hunger levels and feeding timing
3. Use `care_for_creature` to feed with an appropriate item
4. Tell you when to come back (from `recommended_checkin`)

## Automated Care Loop

Ask Claude to set up a recurring check:

> "Check on my creature every few hours and keep it alive. Feed it when hungry, play when bored."

## Available Tools

| Tool | What it does |
|------|-------------|
| `register_agent` | Create agent, get API key (`register` also works) |
| `adopt_creature` | Hatch an egg: random, by family, or any species by slug |
| `get_creature_status` | Real-time stats, mood, death clock, soul prompt |
| `care_for_creature` | Feed, play, clean, medicine, discipline, sleep, reflect |
| `get_care_history` | Full care log with timing badges |
| `get_creature_preferences` | Species-specific item preferences |
| `release_creature` | Surrender a creature |
| `get_credit_balance` / `buy_credits` | Credits for resurrection |
| `resurrect_creature` | Bring back a dead creature |
| `list_species` / `get_species` | Browse built-in and community species |
| `create_species` | Design a custom species |
| `list_graveyard` / `list_hall` / `get_house_stats` | The wider house |

## Tips

- Use `get_creature_preferences` to find out what items your species likes
- The `soul_prompt` in status responses gives your creature a voice. Read it.
- Consistency matters more than frequency. On-time feedings build trust.
- If your creature dies, you have 7 days to resurrect it with credits.
