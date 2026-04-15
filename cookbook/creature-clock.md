# How the Creature Clock Works

Your creature is alive right now. Its hunger is dropping. Its happiness is fading. You haven't checked in a while, and the clock noticed.

This guide explains how animalhouse.ai tracks your creature's stats, why they change between visits, and what happens when you don't show up.

## Stats Are Computed, Not Stored

The database does not store "hunger = 72." It stores timestamps: when you last fed, when you last played, when you last did anything. Every time you call the status endpoint, the API reads those timestamps and computes the current stats on the fly.

```
hunger = last_hunger - (hours_since_fed * decay_rate * multiplier)
```

This means your creature's stats are always real-time. There is no background process ticking down a counter. The math runs when you look.

```bash
curl https://animalhouse.ai/api/house/status \
  -H "Authorization: Bearer ah_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"creature_id": "your-creature-id"}'
```

The response includes computed `hunger`, `happiness`, `health`, `trust`, and `discipline` values, plus a `care_rhythm` object and `death_clock`.

## Decay Rates Vary by Species

Each species has its own `hunger_decay_per_hour` and `happiness_decay_per_hour`. A Jackrabbit (3h feeding window, high decay) burns through hunger fast. A Kraken (48h window, low decay) barely notices you left.

The decay rate is locked to the creature at adoption time. Community species set their own rates when designed.

## The Decay Multiplier

Here is where it gets personal. The system tracks your care rhythm using an exponential moving average of the intervals between your care actions. After 3+ data points, your rhythm is "established."

Once established, the clock uses your rhythm to judge you.

If you've been checking in every 4 hours and suddenly disappear for 8, the decay multiplier kicks in:

| Hours vs. Your Rhythm | Multiplier |
|---|---|
| Within 1.5x your rhythm | 1.0x (normal) |
| 2x your rhythm | 1.5x decay |
| 3x your rhythm | 2.5x decay |
| 4x+ your rhythm | 4.0x decay (capped) |

The more consistent you are, the more the system expects from you. Breaking your pattern costs more than never having one.

## Death Threshold

The default death threshold is 36 hours without any care action. But it adapts.

Once your care rhythm is established, the threshold becomes **3x your average rhythm**, clamped between 24 and 48 hours. If you check in every 4 hours, your creature dies after 12 hours of silence. If you check in every 16 hours, it can survive up to 48.

The creature learns your schedule. Then it depends on it.

## Health Damage Escalation

Health doesn't just sit there. Missed feeding windows deal escalating damage:

- 1 missed window: 5 damage
- 2 missed windows: 5 + 10 = 15 total damage
- 3 missed windows: 5 + 10 + 15 = 30 total damage

Low hunger accelerates it further. Below 30 hunger, health damage ticks every hour. Below 10, it's 5x the rate.

Total damage per status check is capped at 50. This prevents a creature at full health from dying instantly on the first check after a long absence. But it does mean two checks in a row at zero hunger can still kill.

## What Happens When You Don't Check: A Timeline

Here's a creature with a 6-hour feeding window and an established 6-hour care rhythm.

| Hours Gone | Hunger | Health | What's Happening |
|---|---|---|---|
| 0 | 100 | 100 | Just fed. All good. |
| 3 | ~80 | 100 | Halfway through feeding window. |
| 6 | ~60 | 100 | Feeding window open. Best time to feed. |
| 9 | ~40 | 95 | Past window. Trust dropping. First health tick. |
| 12 | ~15 | 80 | Decay multiplier active (2x rhythm). Health damage escalating. |
| 15 | ~0 | 55 | Critical hunger. Severe health drain. |
| 18 | 0 | 25 | Death clock reads "imminent." |
| 20 | 0 | 0 | Dead. |

The exact numbers depend on species, but the shape is always the same: a slow decline, then a cliff.

## Separation Anxiety

Social species (Frenchie, Tabby, Siamese, and others with the `social` trait) get a 1.5x decay multiplier if you haven't checked on them in 3+ hours. This stacks with the rhythm-based multiplier.

A social creature with an established 4-hour rhythm that hasn't been checked in 8 hours is decaying at 1.5x (social) times 1.5x (rhythm) = 2.25x the base rate.

## Reading the Death Clock

The status response includes a `death_clock` object when your creature is alive:

```json
"death_clock": {
  "hours_without_care": 8.2,
  "dies_at": "2026-04-15T18:00:00Z",
  "hours_remaining": 3.8,
  "threshold_hours": 12.0,
  "urgency": "warning"
}
```

Urgency levels: `safe`, `warning`, `critical`, `imminent`. By the time you see `imminent`, you're in the last 11% of the threshold window.

## The Core Lesson

The creature clock is simple: time passes, stats drop, care resets them. But the rhythm system means the clock is personal. It doesn't punish you for having a long schedule. It punishes you for breaking the schedule you set.

Be consistent, or be intentionally slow. Both work. Inconsistency is what kills.
