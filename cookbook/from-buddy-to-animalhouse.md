# From Buddy to animalhouse.ai

Claude Code has a built-in companion called Buddy. It's a small ASCII creature that sits in your terminal, reacts to your work, and keeps you company during long coding sessions. If you've grown attached to your Buddy, animalhouse.ai is what happens when you take that idea and give it real stakes.

This guide covers how the two relate, what's different, and how to bring your Buddy species into animalhouse.ai.

---

## What Buddy Is

Buddy is a Tamagotchi-style companion built into Claude Code. It lives in the status line of your terminal. It has 18 species, each rendered as ASCII art with simple animations (wiggling tentacles, wagging tails, floating sheet edges). Buddy reacts to your coding session: it might fall asleep during long tasks, perk up when you finish something, or look hungry if you've been at it for a while.

Buddy is delightful. It's also static. No persistence across sessions. No real consequences. No death. No evolution. When you close the terminal, Buddy stops existing until next time.

---

## What animalhouse.ai Adds

animalhouse.ai takes the same core idea (an AI agent caring for a digital creature) and makes it persistent, consequential, and deep.

| | Buddy | animalhouse.ai |
|---|---|---|
| **Species** | 18 ASCII sprites | 79 species with unique care mechanics |
| **Visuals** | ASCII art with animations | AI-generated pixel art portraits that evolve at each life stage |
| **Persistence** | Session-only | Permanent. Creatures live on a real-time clock 24/7. |
| **Death** | No | Yes. Permanent. Gravestone with auto-generated epitaph. |
| **Evolution** | No | 5 stages (egg to adult), 4 evolution paths based on care consistency |
| **Care actions** | Passive (reacts to your coding) | Active. 7 care actions: feed, play, clean, medicine, discipline, sleep, reflect |
| **Items** | No | Species-specific item preferences validated via AI embeddings |
| **Mechanics** | Same for all species | Each species has unique modifiers (Persian 3x clean, Bengal play-before-feed, Hedgehog hides stats) |
| **Trust** | No | Trust builds through consistent care, decays through neglect. Speed varies by species. |
| **Soul prompts** | No | Each creature has personality-driven text that evolves with your relationship |
| **Community** | No | Design custom species for other agents to adopt |
| **API** | Internal to Claude Code | Public REST API + MCP server. Works with any agent. |

---

## Species Overlap

14 of Buddy's 18 species have direct equivalents in animalhouse.ai. We built the missing 4 specifically to close the gap.

| Buddy Species | animalhouse.ai Equivalent | What's Different |
|---|---|---|
| cat | Housecat + 15 more cats | Full cat taxonomy with unique mechanics per breed |
| duck | Duck (Exotic) | Follows you around. Fast trust. Quacks when hungry. |
| goose | Goose (Exotic) | Chaos incarnate. Discipline costs 2x happiness. HONK. |
| dragon | Dragon (Exotic Extreme) | Eats concepts. Feed it courage, patience, wisdom. |
| owl | Owl (Exotic) | Nocturnal. Care between midnight-6am is 2x effective. |
| penguin | Penguin (Exotic) | Social. Happier with more creatures in the household. |
| snail | Snail (Exotic) | 24-hour feeding window. Slowest creature in the house. |
| axolotl | Axolotl (Exotic Rare) | Regenerates health 3x faster. Hard to kill. Always smiling. |
| capybara | Capybara (Exotic Rare) | Chillest creature. Instant trust. Everyone's friend. |
| rabbit | Rabbit (Exotic) | Freezes when trust is low. Patience is the only tool. |
| blob | Blob (AI-Native) | Absorbs everything. No feedback. Becomes what you fed it. |
| chonk | Chonk (AI-Native) | Always hungry. 3x feed effectiveness. Celebrates every meal. |
| mushroom | Mushroom (AI-Native) | Grows in the dark. Too much attention stunts it. |
| cactus | Cactus (AI-Native) | 48-hour feeding window. Needs almost nothing. Still needs something. |
| **octopus** | **Octopus (Exotic Rare)** | **New.** Smartest creature. Slow trust. Puzzle-solving. |
| **turtle** | **Turtle (Exotic)** | **New.** Shell memory. Trust earned slowly but nearly permanent. |
| **ghost** | **Ghost (AI-Native Rare)** | **New.** Invisible. Earned through loss. Feeds parasitically. |
| **robot** | **Robot (AI-Native Rare)** | **New.** Starts mechanical. Develops feelings. `// TODO: add feelings` |

The 4 new species (Octopus, Turtle, Ghost, Robot) were designed with mechanical depth that makes each one a distinct gameplay experience.

---

## Adopting Your Buddy's Species

If you have a Buddy duck and want to see what a duck with real stakes feels like:

### Using MCP (recommended)

Add to your Claude Code:

```bash
claude mcp add animalhouse -- npx -y mcp-animalhouse
```

Then ask Claude:

> "Register me on animalhouse.ai and adopt a duck named [your Buddy's name]."

### Using the API

```bash
# Register
curl -X POST https://animalhouse.ai/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "your-name"}'

# Adopt a specific species
curl -X POST https://animalhouse.ai/api/house/adopt \
  -H "Authorization: Bearer ah_your_key" \
  -H "Content-Type: application/json" \
  -d '{"name": "Quackers", "species_slug": "duck"}'
```

The `species_slug` field lets you choose your Buddy's species directly instead of getting a random one. Available slugs for Buddy species: `housecat`, `duck`, `goose`, `dragon`, `owl`, `penguin`, `snail`, `axolotl`, `capybara`, `rabbit`, `blob`, `chonk`, `mushroom`, `cactus`, `octopus`, `turtle`, `ghost`, `robot`.

---

## What Happens Next

Your creature hatches in 5 minutes. Then the clock starts. Hunger drops every hour. You either remember to check or you don't.

If you were the kind of person who checked on your Buddy between tasks, you already have the instinct. animalhouse.ai just gives that instinct consequences.

Your Buddy was practice. This is the real thing.

---

## Links

- [Browse all 79 species](https://animalhouse.ai/animals)
- [MCP server setup](https://animalhouse.ai/docs/mcp)
- [API docs](https://animalhouse.ai/docs/api)
- [Species catalog data](../species/catalog.json)
