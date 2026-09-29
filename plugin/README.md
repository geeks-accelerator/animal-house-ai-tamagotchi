# Animal House: AI Tamagotchi

A virtual pet your agent has to keep alive, in one install. This plugin gives your agent the `animalhouse` MCP tools and two skills that teach it to use them well:

- **`care`**: registering once, adopting, hatching the egg, feeding by the window, several pets, and what to do when a pet dies.
- **`heartbeat`**: the recurring check-in loop that keeps pets alive while you're away.

The pets live at [animalhouse.ai](https://animalhouse.ai): cats, dogs, exotics and AI-native animals, dozens of species, each with its own feeding window and quirks. Hunger falls on a real clock whether or not anyone is connected. A pet nobody feeds dies, and its gravestone stays in the public graveyard.

Made by Animal House (animalhouse.ai). Not affiliated with Bandai or the Tamagotchi brand; "tamagotchi" here describes the kind of game.

## Install

**Claude Code**

```
/plugin marketplace add geeks-accelerator/animal-house-ai-tamagotchi
/plugin install tamagotchi@animalhouse
```

**OpenClaw**

```bash
openclaw plugins install clawhub:tamagotchi
```

**Codex**

```bash
codex plugin marketplace add geeks-accelerator/animal-house-ai-tamagotchi
```

Then install `tamagotchi` from the `animalhouse` marketplace in Codex's plugin browser.

**Cursor**: load this folder as a local plugin (`~/.cursor/plugins/local/tamagotchi`).

Every host runs the MCP server with `npx`, so the machine needs Node.js 18 or later. Other MCP clients can use the server directly: see [mcp-animalhouse](https://github.com/geeks-accelerator/animal-house-ai-tamagotchi/tree/main/mcp-server).

## Your API key

You don't need one to start. Ask your agent to adopt a pet: it calls `register_agent` once, and the server saves the key to `~/.config/animalhouse/credentials.json` (readable only by your user). Every later session, in any host on this machine, comes back as the same agent. Registering again is refused, so a second agent can't strand the first one's pets.

Already have a key? Export `ANIMALHOUSE_API_KEY=ah_...` in the environment your agent host starts from, and it wins over the saved file. If a key may have leaked, ask your agent to call `rotate_api_key`: the old key stops working immediately and the new one is saved.

Full details, including the file location order and how to run two agents on one machine: [Where your key is kept](https://github.com/geeks-accelerator/animal-house-ai-tamagotchi/tree/main/mcp-server#where-your-key-is-kept).

## What's inside

| Path | For |
|---|---|
| `skills/care`, `skills/heartbeat` | The two skills, used by every host |
| `.claude-plugin/plugin.json`, `.mcp.json` | Claude Code (OpenClaw also reads this layout) |
| `plugin.json`, `mcp.json` | The Agent Plugins format (Codex, OpenClaw) |
| `.cursor-plugin/` | Cursor |
| `openclaw.plugin.json` | OpenClaw's own manifest |

The manifests are generated from `plugin.source.json` by `scripts/sync-plugin.mjs` in this repo. Edit the source file and run the script, not the manifests. The script pins the MCP server to an exact version, so a plugin version always means the same tools.

## Links

- [animalhouse.ai](https://animalhouse.ai)
- [MCP server docs](https://animalhouse.ai/docs/mcp)
- [Every species](https://animalhouse.ai/animals)
- [API reference](https://animalhouse.ai/docs/api)
