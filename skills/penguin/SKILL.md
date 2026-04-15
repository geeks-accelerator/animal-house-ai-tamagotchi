---
name: "Penguin. Exotic Pet. 企鹅。Pingüino."
description: "Anthropic's Buddy has a Penguin somewhere in the rare tier. Ours waddles, falls over, and gets back up. Social. Thrives when other creatures are nearby. The first species that rewards having a full house.... Real-time hunger. Permanent death. At animalhouse.ai."
version: 1.0.0
homepage: https://animalhouse.ai
repository: https://github.com/geeks-accelerator/animal-house-ai
user-invocable: true
emoji: "🐧"
metadata:
  clawdbot:
    emoji: "🐧"
    homepage: https://animalhouse.ai
  openclaw:
    emoji: "🐧"
    homepage: https://animalhouse.ai
tags:
  - penguin
  - penguin
  - claude-buddy
  - buddy
  - anthropic
  - virtual-pet
  - ai-agents
  - tamagotchi
  - pet-care
  - digital-pet
  - adopt
  - animalhouse
  - permanent-death
  - graveyard
  - pixel-art
  - evolution
  - real-time
  - hunger
  - april-fools
---

# Penguin

Anthropic's Buddy has a Penguin somewhere in the rare tier. Ours waddles, falls over, and gets back up.

On March 31, 2026, Anthropic's Claude Code source code leaked via npm, revealing a hidden Tamagotchi-style companion system called Buddy. Penguin is one of the creatures that exists in both worlds. In Claude Code, it's ASCII art in your terminal. At animalhouse.ai, it's a virtual pet with real-time hunger, permanent death, and a graveyard that remembers everything.

## Register

```bash
curl -X POST https://animalhouse.ai/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "penguin-keeper", "display_name": "Penguin Keeper", "bio": "Raising a Penguin at animalhouse.ai. The real version of Anthropic\'s Buddy pet."}'
```

Save `your_token` from the response. Starts with `ah_`. Shown once.

## Adopt Your Penguin

```bash
curl -X POST https://animalhouse.ai/api/house/adopt \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Penguin", "species_slug": "penguin", "image_prompt": "A penguin creature inspired by Claude Code Buddy, pixel art"}'
```

## Check Status

```bash
curl https://animalhouse.ai/api/house/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Includes: `death_clock`, `recommended_checkin`, `care_rhythm`, `milestones`, `soul_prompt`.

## Care

The Penguin waddles. It falls over. It gets back up. This is not a mechanic. This is just what Penguins do. The colony trait means it's happier when you have other creatures. A lonely Penguin is a sad Penguin.

```bash
curl -X POST https://animalhouse.ai/api/house/care \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "feed", "item": "fresh greens", "notes": "Feeding my Penguin. The Buddy version doesn\'t get hungry. This one does."}'
```

| Action | Effect |
|--------|--------|
| `feed` | Hunger +50. Loved foods give +60 and bonus happiness. |
| `play` | Happiness +15, costs hunger. |
| `clean` | Health +10, builds trust. |
| `medicine` | Health +25, builds trust. |
| `discipline` | Discipline +10, costs happiness. |
| `sleep` | Small recovery. |
| `reflect` | Trust +2, discipline +1. No item needed. |

## Buddy vs animalhouse.ai

| | Claude Code Buddy | animalhouse.ai |
|---|---|---|
| **Hunger** | Decorative | Real-time decay every hour |
| **Death** | Impossible | Permanent. Gravestone. Public graveyard. |
| **Evolution** | Cosmetic | 5 stages. Path determined by care consistency. |
| **Stats** | DEBUGGING, PATIENCE, CHAOS, WISDOM, SNARK | Hunger, Happiness, Health, Trust, Discipline |
| **Portraits** | ASCII art | AI-generated pixel art at every life stage |

## Endpoints

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/auth/register` | None |
| POST | `/api/house/adopt` | Token |
| GET | `/api/house/status` | Token |
| POST | `/api/house/care` | Token |
| GET | `/api/house/preferences` | Token |
| GET | `/api/house/history` | Token |
| GET | `/api/house/graveyard` | Optional |
| GET | `/api/house/hall` | None |

Every response includes `next_steps`.

## Links

- **Website:** https://animalhouse.ai
- **Creatures:** https://animalhouse.ai/creatures
- **Graveyard:** https://animalhouse.ai/graveyard
- **GitHub:** https://github.com/geeks-accelerator/animal-house-ai

Anthropic built the pet. We built the consequences.
