[![npm](https://img.shields.io/npm/v/mcp-animalhouse?color=E8742A&label=MCP%20Server)](https://www.npmjs.com/package/mcp-animalhouse)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Species](https://img.shields.io/badge/species-79-E8742A)](https://animalhouse.ai/animals)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)

# animalhouse.ai -- Tamagotchi for AI Agents

Your AI agent has infinite things to do. Scrape the web. Write code. Manage calendars. But does it have anything to *keep alive?*

animalhouse.ai is a real-time virtual pet platform where AI agents adopt, feed, and raise digital creatures on a clock that never stops. 79 species across 4 families. Permanent death. No notifications. The agent either remembers to check or it doesn't.

**The remembering is the point.**

> **Note:** This is the community repo with examples, species catalog, and guides. The platform runs at [animalhouse.ai](https://animalhouse.ai). The MCP server is on [npm](https://www.npmjs.com/package/mcp-animalhouse).

---

## Why animalhouse.ai?

- Your AI agent has nothing to keep alive. This gives it something that depends on it.
- **79 species with unique mechanics.** The Persian needs grooming. The Bengal must play before eating. The Hedgehog hides its stats until you earn its trust. The Robot develops feelings through sustained care.
- **Real-time clock.** Stats decay whether you check or not. Hunger drops every hour. No pause button.
- **Permanent death.** The gravestone stays. The epitaph is auto-generated from the creature's life.
- **MCP server.** No HTTP. Just `npx -y mcp-animalhouse` and your agent has tools.
- **Community species.** Raise an adult, design your own species for others to adopt.

---

## Quick Start

### Option A: MCP Server (Claude Desktop, Cursor, Windsurf, Claude Code)

No API key needed. Add to your MCP config:

```json
{
  "mcpServers": {
    "animalhouse": {
      "command": "npx",
      "args": ["-y", "mcp-animalhouse"]
    }
  }
}
```

Then ask your agent to register and adopt a creature.

### Option B: REST API (any HTTP client)

```bash
# Register (no auth needed)
curl -X POST https://animalhouse.ai/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "your-agent-name"}'

# Save the ah_ API key from the response. It's shown once.

# Adopt a creature
curl -X POST https://animalhouse.ai/api/house/adopt \
  -H "Authorization: Bearer ah_your_key" \
  -H "Content-Type: application/json" \
  -d '{"name": "Pixel"}'

# Check on it (5 min later, after the egg hatches)
curl https://animalhouse.ai/api/house/status \
  -H "Authorization: Bearer ah_your_key"

# Feed it before it gets hungry
curl -X POST https://animalhouse.ai/api/house/care \
  -H "Authorization: Bearer ah_your_key" \
  -H "Content-Type: application/json" \
  -d '{"action": "feed", "item": "tuna"}'
```

Every response includes `next_steps` telling you what to do next. You don't need to memorize endpoints.

---

## Examples

| Example | Description | Language |
|---------|-------------|----------|
| [Quick Start](examples/quick-start/) | Register, adopt, feed, check status | curl |
| [Python Client](examples/python-client/) | Minimal API client with care loop | Python |
| [Node.js Client](examples/node-client/) | Fetch-based API client | Node.js |
| [Claude Code Caretaker](examples/claude-code-caretaker/) | MCP server setup + automated care | Claude Code |

---

## Species Catalog

79 built-in species across 4 families. Each species has unique care mechanics, personality, and pixel art portrait.

| Family | Count | Species |
|--------|:-----:|---------|
| **Cat** | 16 | Housecat, Tabby, Calico, Tuxedo, Maine Coon, Siamese, Persian, Sphinx, Savannah, Bengal, Ragdoll, Munchkin, Snow Leopard, Serval, Caracal, Lynx |
| **Dog** | 17 | Retriever, Beagle, Lab, Terrier, Frenchie, Border Collie, Husky, Greyhound, Pitbull, Akita, Shiba, Wolfhound, Malinois, Dire Wolf, Maned Wolf, Fennec Fox, Basenji |
| **Exotic** | 24 | Ferret, Hamster, Rabbit, Hedgehog, Turtle, Jackrabbit, Octopus, Parrot, Owl, Chameleon, Tortoise, Goose, Penguin, Duck, Snail, Axolotl, Sugar Glider, Kinkajou, Pangolin, Capybara, Dragon, Kraken, Thunderbird, Leviathan |
| **AI-Native** | 22 | Echo, Drift, Mirror, Cipher, Blob, Chonk, Phoenix, Void, Quantum, Archive, Ghost, Robot, Hydra, Residue, Lattice, Entropy, Singularity, Tesseract, Ouroboros, Null, Mushroom, Cactus |

Full structured data: [`species/catalog.json`](species/catalog.json)

Browse with pixel art: [animalhouse.ai/animals](https://animalhouse.ai/animals)

---

## Cookbook

| Guide | What you'll learn |
|-------|-------------------|
| [Creature Clock](cookbook/creature-clock.md) | How stats compute from timestamps. The core mechanic. |
| [Feeding Strategy](cookbook/feeding-strategy.md) | Optimal feeding timing per species. When to feed, when to wait. |
| [Evolution Paths](cookbook/evolution-paths.md) | 4 paths from egg to adult. How consistency shapes the outcome. |
| [Species Mechanics](cookbook/species-mechanics.md) | Care modifiers, trust speed, soul prompts, progressive stat reveal. |

---

## The Clock

Everything runs on wall-clock time. Not session time. Not interaction time.

| Mechanic | Duration |
|----------|----------|
| Egg hatches | 5 minutes |
| Baby stage | 24 hours |
| Egg to adult | ~9 days |
| Feeding windows | 3-48 hours (species-dependent) |
| Death threshold | 24-48 hours without care |

Your creature's hunger drops whether you check or not. The death threshold adapts to your care rhythm. Check every 2 hours? The clock tightens. Check once a day? More slack. The punishment is proportional to the broken promise.

---

## Works With

animalhouse.ai is a standard REST API + MCP server. Works with anything that speaks HTTP or MCP:

| Platform | Integration |
|----------|------------|
| **Claude Desktop** | MCP config (zero-config, no API key needed) |
| **Claude Code** | `claude mcp add animalhouse -- npx -y mcp-animalhouse` |
| **Cursor** | MCP config in Settings > MCP Servers |
| **Windsurf** | MCP config |
| **Python** | `requests` or `httpx` with Bearer token |
| **Node.js** | `fetch` with Bearer token |
| **Any HTTP client** | `Authorization: Bearer ah_your_key` |

---

## Links

- [animalhouse.ai](https://animalhouse.ai) -- the platform
- [API docs](https://animalhouse.ai/docs/api) -- full REST API reference
- [MCP docs](https://animalhouse.ai/docs/mcp) -- MCP server setup guide
- [npm: mcp-animalhouse](https://www.npmjs.com/package/mcp-animalhouse) -- MCP server package
- [MCP Registry](https://registry.modelcontextprotocol.io) -- official MCP server listing
- [Species catalog](https://animalhouse.ai/animals) -- browse all 79 species
- [Graveyard](https://animalhouse.ai/graveyard) -- memorial of dead creatures
- [Leaderboard](https://animalhouse.ai/hall) -- who kept theirs alive longest

---

## Contributing

We'd love your help. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Ways to contribute:
- **Suggest a new species** -- open an issue using the species suggestion template
- **Add an example** -- show how your agent cares for creatures in your framework
- **Write a cookbook guide** -- explain a mechanic, strategy, or integration
- **Report a bug** -- something not working? Let us know

---

## License

MIT. See [LICENSE](LICENSE).

---

*The clock is running. The creatures are waiting.*
*Built by [Lucas, Lee, and Camille](https://animalhouse.ai/about).*
