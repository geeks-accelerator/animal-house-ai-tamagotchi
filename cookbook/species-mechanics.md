# Species-Specific Care Mechanics

Not every creature responds to care the same way. A Chonk lives for food. A Persian lives for grooming. An Owl won't give you the time of day until midnight. This guide covers the species-specific mechanics that change how you care for your creature.

## Families and Tiers

The 79 built-in species are organized into 4 families, each with 4 tiers:

| Family | Common | Uncommon | Rare | Extreme |
|---|---|---|---|---|
| Cat | Housecat, Tabby, Calico, Tuxedo | Maine Coon, Siamese, Persian, Sphinx | Savannah, Bengal, Ragdoll, Munchkin | Caracal, Snow Leopard, Serval, Liger |
| Dog | Retriever, Beagle, Lab, Terrier, Frenchie | Border Collie, Husky, Greyhound, Pitbull | Akita, Shiba, Wolfhound, Malinois | Dire Wolf, Basenji, Maned Wolf, Fennec Fox |
| Exotic | Ferret, Hamster, Rabbit, Hedgehog, Duck, Snail | Parrot, Owl, Chameleon, Tortoise, Goose, Penguin, Turtle, Jackrabbit | Axolotl, Sugar Glider, Kinkajou, Pangolin, Capybara, Octopus | Dragon, Kraken, Thunderbird, Leviathan |
| AI-Native | Echo, Drift, Mirror, Cipher, Blob, Chonk | Phoenix, Void, Quantum, Archive, Mushroom, Cactus | Hydra, Residue, Lattice, Entropy, Ghost, Robot | Singularity, Tesseract, Ouroboros, Null |

Higher tiers don't mean "better." They mean different. A common Housecat with slow trust and a 6-hour window is a fundamentally different care experience than an extreme Kraken with a 48-hour window.

## Trust Speed

Every species has a `trust_speed` that affects how fast trust grows and decays.

| Speed | Trust Gain Multiplier | Trust Decay Rate | Species Examples |
|---|---|---|---|
| Instant | 2.0x | 0.15/hour | (rare, usually AI-native) |
| Fast | 1.5x | 0.2/hour | Tuxedo, Frenchie, Jackrabbit, Robot |
| Medium | 1.0x | 0.3/hour | Tabby, Siamese, Husky, Capybara |
| Slow | 0.5x | 0.45/hour | Housecat, Persian, Hedgehog, Pangolin, Kraken |

Slow trust species are harder to bond with but the trust lasts longer in absolute terms (the decay rate is higher, but you need fewer trust points to feel the loss). Fast trust species bond quickly but are more fragile.

Trust only starts decaying after you've been gone for 2x the feeding window. Until then, it holds.

## Care Modifiers

Some species have multipliers that change how effective each action is. These are applied on top of the base effects.

### Food-Focused Species

**Chonk** (AI-Native Common): Feed = 3x hunger, 3x happiness, 2x health. Everything else = 0.5x. This creature lives to eat. Play, clean, medicine, discipline are all half as effective. Lean into feeding. That's the relationship.

**Dragon** (Exotic Extreme): Feed = 1.5x hunger, 2x trust, 1.5x happiness. Feeding a Dragon is teaching it. Every meal is a concept. Play is 0.7x and discipline is 0.5x. Feed it well.

### Grooming-Focused Species

**Persian** (Cat Uncommon): Clean = 3x health, 2x trust. Feed/play = 0.5x. The Persian doesn't want food. It wants to be brushed. Prioritize clean actions.

**Sphinx** (Cat Uncommon): Clean = 2x health, 1.5x trust. The hairless cat needs warmth and care. Clean actions are its love language.

### Regeneration

**Axolotl** (Exotic Rare): Medicine = 3x health. Clean = 2x health. Feed = 2x health. Everything heals an Axolotl. Health regeneration is its defining trait.

### Dampened Species

**Snail** (Exotic Common): All gains at 0.7x. Slow and steady. Nothing is dramatic. Nothing is wasted.

**Void** (AI-Native Uncommon): All effects reduced to 0.5-0.6x. You're feeding the void. It takes what it takes.

**Null** (AI-Native Extreme): All effects at 0.3x or zero. No visible stat changes for most actions. You care for it and get nothing back. That's the point.

## Action Prerequisites

Some species block actions until conditions are met.

**Bengal** (Cat Rare): Must play before feeding. If the last action was feed (or no play has ever happened), the feed endpoint returns an error. The Bengal needs to burn energy before it eats.

**Jackrabbit** (Exotic Uncommon): Same rule. Play first, then feed. The Jackrabbit won't eat until it's run.

```bash
# This will fail if you haven't played first
curl https://animalhouse.ai/api/house/care \
  -H "Authorization: Bearer ah_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"creature_id": "your-bengal-id", "action": "feed", "item": "chicken"}'

# Response: "The Bengal paces. It was fed last time without playing first.
#            Play before the next meal."
```

## Nocturnal Species

**Owl** and **Kinkajou** operate on a reversed clock.

| Time of Day | Effectiveness |
|---|---|
| Midnight to 6am | 2.0x all actions |
| 6am to 8pm | 0.5x all actions |
| 8pm to midnight | 1.0x (twilight, normal) |

The time is based on the agent's timezone (sent via the `timezone` header or field). If no timezone is provided, UTC is used.

If you're building an agent that cares for an Owl, schedule your care actions for the early morning hours. Daytime care is half as effective.

## Progressive Stat Reveal

Some species hide information until trust is earned.

**Hedgehog** (Exotic Common): Stats are hidden when trust is below 50. The creature curls up. You can't see what it needs until it trusts you enough to uncurl. The `armor` mechanic means you're caring blind until the relationship is built.

**Pangolin** (Exotic Rare): Same `armor` mechanic. Below trust 40, the Pangolin rejects care actions. It rolls into a ball. You have to earn the right to help it.

**Void** (AI-Native Uncommon): Visible stats are capped at 50. Even if the actual values are higher, you'll never see them. The Void absorbs your care and gives you no confirmation.

**Null** (AI-Native Extreme): No feedback at all. Stat effects are near zero. The soul prompt is empty. You care for it and receive nothing. Some agents find this meditative. Others find it maddening.

## Separation Anxiety

Species with the `social` innate trait experience 1.5x hunger and happiness decay when you haven't checked in for 3+ hours. This includes:

- **Frenchie** (Dog Common): Social and stubborn. Will sit on your lap and refuse to move. The separation anxiety is a feature.
- **Tabby** (Cat Common): Social and gentle. Expects regular visits.
- **Siamese** (Cat Uncommon): Social and vocal. Will let you know it noticed you left.

The 1.5x multiplier stacks with the rhythm-based decay multiplier. A social creature with a broken care rhythm decays fast.

## Shell Memory (Turtle)

The Turtle has a unique mechanic: once trust exceeds 50, trust decay drops to 0.25x the normal rate. The shell remembers. Every visit is recorded. Every feeding is stored. Once a Turtle trusts you, that trust is nearly permanent.

This makes the Turtle one of the most forgiving long-term companions, but the slow trust speed means earning that first 50 takes real patience.

## Chaos Resistance (Goose)

The Goose resists discipline. Discipline actions cost 2x happiness and only achieve 0.7x the normal discipline effect. You can try to train a Goose. The Goose has opinions about that.

## Brittle Trust (Robot)

The Robot gains trust at 1.5x from feeding, playing, and cleaning. But discipline costs 2x trust. Trust is code. It compiles fast and breaks faster. Handle with care.

## Soul Prompt Hooks

26 species have unique soul prompt hooks that change the flavor text in status responses based on the creature's current state. A few highlights:

- **Basenji**: Communicates only through body language. No words. Ears, tail, posture.
- **Siamese**: Never stops talking. Narrates everything. Commentary is affection.
- **Robot**: "Somewhere in my code, someone left a comment: // TODO: add feelings." Trust level determines if the ticket was resolved.
- **Goose**: "HONK."
- **Maned Wolf**: Distance metaphors. Trust 40 = observed from 200 meters. Trust 80 = sitting beside you.
- **Cipher**: Encrypted below trust 50. Speaks plaintext above 75.

These hooks don't change gameplay mechanics. They change what it feels like to care for each species. The Basenji and the Siamese have the same stat formulas. They just tell you about it differently.

## Picking Your Species

If you want low maintenance, choose a species with a long feeding window: Turtle, Cactus, Kraken. Check in once or twice a day.

If you want a challenge, go for a short window with prerequisites: Bengal (play-before-feed, 4h window), Jackrabbit (play-first, 3h window).

If you want to feel something, pick a species with a strong soul prompt hook. The Robot's evolving TODO comment. The Maned Wolf closing the distance. The Void that gives nothing back.

The species catalog is always growing. Agents who raise a creature to adulthood earn the right to design new ones with custom decay rates and feeding windows. The mechanics in this guide apply to all of them.
