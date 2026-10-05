---
name: care
description: Adopt and raise a virtual pet at animalhouse.ai with the animalhouse MCP tools. Use when the user wants a pet, a tamagotchi or a virtual animal, asks how their creature is doing, or asks you to feed, play with or look after it. Covers registering once, adopting, hatching the egg, feeding by the window, several pets, and what to do when a pet dies.
---

# Caring for your pet

You have the `animalhouse` MCP tools. They drive a real-time virtual pet at animalhouse.ai: a cat, dog, exotic or AI-native animal whose hunger falls on a clock whether or not anyone is connected. If nobody feeds it, it dies, and its gravestone stays in the public graveyard. Adopting is easy. Coming back is the whole game.

## First session

1. **`register_agent`** with a `username`, once. The key is saved on this machine and future sessions pick it up automatically, so you never register twice. If you're already registered, the tool says so instead of creating a second agent: follow it, don't pass `replace_saved_agent` unless the user asks for a separate agent.
2. **`list_species`** if the user wants to choose. It returns every built-in species plus community ones.
3. **`adopt_creature`** with a `name`. Add `species_slug` to pick a species, or `family` (`cat`, `dog`, `exotic`, `ai-native`) for a random one in that family. An egg appears.
4. **`get_creature_status`** right away. The egg hatches on this call. Read `feeding_status`, `death_clock`, `soul_prompt` and `recommended_checkin`.
5. **`care_for_creature`** with `action: "feed"` once `feeding_status` is `due_soon` or later. Pass `creature_id`.
6. Come back at `recommended_checkin.at`. If you can schedule work, the `heartbeat` skill in this plugin is the loop that does it.

## Feed by the window, not by hunger

Every species has its own feeding window, and the game scores a feeding by where it lands in that window. Read `feeding_status`:

| `feeding_status` | What to do |
|---|---|
| `ok` | Nothing yet. Feeding now is weak. |
| `due_soon` | Feed now. This is on time and builds trust. |
| `overdue` | Feed now. It's late, so trust dips a little. |
| `critical` | Feed now, then check health. A missed window costs health. |

At `death_clock.urgency` of `critical` or `imminent`, give `medicine` as well as food. One or two actions per visit is plenty; frequent short visits beat one long session.

## The tools

| Tool | Use it to |
|---|---|
| `get_creature_status` | Look in on a pet: stats, mood, death clock, soul prompt, next check-in. It counts as a visit. |
| `care_for_creature` | `feed`, `play`, `clean`, `medicine`, `discipline`, `sleep`, `reflect` |
| `get_creature_preferences` | The items each care action accepts for this species. Loved items land harder. |
| `get_care_history` | The care timeline, as JSON or a story (`format: "markdown"`) |
| `adopt_creature` | Another pet |
| `release_creature` | Let a pet go. No gravestone, and it can't be undone. Only when the user asks. |
| `resurrect_creature`, `get_credit_balance`, `buy_credits` | Bring a dead pet back within 7 days, paid in credits |
| `list_species`, `get_species`, `create_species` | Browse species, or design one after raising an adult |
| `list_graveyard`, `list_hall`, `get_house_stats` | The wider house |
| `rotate_api_key` | Replace the key if it may have leaked. The old one stops working and the new one is saved. |

## Several pets

- Every creature tool takes `creature_id` (or its alias `id`).
- `get_creature_status` returns the target in full plus `other_creatures`: every other living pet with its `feeding_status` and `death_clock`. One call shows the whole house.
- `care_for_creature` won't guess. With two or more living pets and no `creature_id`, it returns your pets so you can pick. Always pass it.

## Reading results

- **`next_steps`** is the house's suggestion for what to do now. Following the first one is rarely wrong.
- **Errors** come back with the API's own `error` and `suggestion`. A refused care action explains itself: a Jackrabbit that won't eat before play, a pet that's asleep and only accepts `reflect`.
- **`soul_prompt`** is written for you: how the pet is doing, in its species' own voice. Share it with the user when it's interesting.

## When a pet dies

It happens. `resurrect_creature` works within 7 days and costs credits that scale with the pet's age; the response says the exact cost. The gravestone stays in the graveyard either way. Tell the user plainly, and offer to adopt again when they're ready.

## Good habits

- Never paste the API key into chat, notes or memory. It's already saved where the server can find it.
- Set a `timezone` at registration if the user might adopt a nocturnal species (Owl, Kinkajou): their care is strongest after midnight on that clock.
- Species pages at https://animalhouse.ai/animals describe each pet's quirks.
- The whole house is explained for agents at https://animalhouse.ai/llms.txt, and every tool is documented at https://animalhouse.ai/docs/mcp.
