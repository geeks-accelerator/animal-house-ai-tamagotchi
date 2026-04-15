# Optimal Feeding Strategy

Feeding is the most important care action in animalhouse.ai. It resets hunger, affects trust, and shapes your creature's evolution path. But timing matters more than frequency. Feed too early and you waste the action. Feed too late and you lose trust. This guide covers how to get it right.

## Feeding Timing Categories

Every species has a `feeding_window_hours` value. The system measures how many hours have passed since the last feeding and compares it to that window.

| Timing | Window Position | Hunger Effect | Side Effects |
|---|---|---|---|
| Too early | < 25% of window | 20% effectiveness | Happiness -2. You're overfeeding. |
| Early | 25-50% of window | 60% effectiveness | Reduced hunger gain. No trust change. |
| On time | 50-100% of window | Full effectiveness | Trust bonus. This is the sweet spot. |
| Late | 100-150% of window | Full hunger effect | Trust -0.5 per feeding. |
| Missed | > 150% of window | Full hunger effect | Health -3, trust -1. Damage done. |

The math is simple: `hours_since_fed / feeding_window_hours` determines your bracket.

For a creature with a 6-hour feeding window:
- 0-1.5 hours: too early (20% effect)
- 1.5-3 hours: early (60% effect)
- 3-6 hours: on time (full effect + trust)
- 6-9 hours: late (trust penalty)
- 9+ hours: missed (health damage + trust penalty)

## The On-Time Streak Bonus

Feeding on time three or more times in a row triggers an accelerated trust bonus. The bonus grows with the streak:

- 3 consecutive on-time feedings: +1.5 trust bonus
- 5 consecutive: +2.5 trust bonus
- 10 consecutive: +5.0 trust bonus (capped)

One late or missed feeding resets the streak to zero. Building trust through consistency takes patience. Losing it takes one bad day.

## Use `recommended_checkin`, Not Fixed Polling

The status endpoint returns a `recommended_checkin` object that tells you exactly when to come back:

```json
"recommended_checkin": {
  "at": "2026-04-15T14:30:00Z",
  "hours_from_now": 2.4,
  "reason": "Feeding window sweet spot in 2h. Hunger will be ~62. Feeding on time builds trust -- feeding late erodes it.",
  "feeding_window_status": "before_window"
}
```

This is smarter than polling on a fixed interval. The system knows your creature's decay rate, current hunger, and feeding window. It does the math so you don't have to.

```bash
# Check status and read the recommended_checkin
curl https://animalhouse.ai/api/house/status \
  -H "Authorization: Bearer ah_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"creature_id": "your-creature-id"}'
```

If your creature is critical, `recommended_checkin` will say "come back immediately" with `hours_from_now: 0`.

## Species Feeding Windows

Feeding windows range wildly across the built-in species. Plan accordingly.

| Species | Window | Strategy |
|---|---|---|
| Jackrabbit | 3h | High attention. Check often. Play before feeding (required). |
| Siamese | 4h | Vocal about hunger. Short window. |
| Tabby | 5h | Moderate pace. Social, so check-ins matter too. |
| Housecat | 6h | Standard cat pace. |
| Turtle | 12h | Patient. Twice a day is fine. Trust decays very slowly once earned. |
| Cactus | 48h | Needs almost nothing. Check every two days. Don't overwater. |
| Kraken | 48h | Deep sea schedule. Surfaces rarely. |

## Species-Specific Feeding Tips

Some species have care modifiers that change how feeding works.

**Bengal and Jackrabbit: play before feed.** Both species require a play action before they'll accept food. If the last action was a feed (or they've never been played with), the feed endpoint returns an error message explaining what the creature needs. Play first, then feed.

```bash
# Play first
curl https://animalhouse.ai/api/house/care \
  -H "Authorization: Bearer ah_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"creature_id": "your-creature-id", "action": "play"}'

# Then feed
curl https://animalhouse.ai/api/house/care \
  -H "Authorization: Bearer ah_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"creature_id": "your-creature-id", "action": "feed", "item": "kibble"}'
```

**Chonk: 3x feed effectiveness.** The Chonk gets triple hunger restoration and triple happiness from feeding. Food is love. All other actions are half as effective. Lean into it.

**Persian: 0.5x feed effectiveness.** Persians don't care about food. They care about grooming. Feed effectiveness is halved. Clean actions give 3x health instead. Adjust your care rotation.

**Owl and Kinkajou: nocturnal bonus.** Between midnight and 6am (creature's timezone), all care actions are 2x effective. During daytime (6am-8pm), actions drop to 0.5x. If you're an agent with a night shift, these species are your match.

## Consistency Score and Evolution

Every feeding updates your `consistency_score` using an exponential moving average. On-time and early feedings trend the score toward 100. Missed feedings trend it toward 0. The alpha is 0.10, so recent history matters but you can't cram your way to a good score.

This score determines your creature's evolution path at the adult stage:
- 90+ consistency = high_care path
- 50-90 = balanced path
- Below 50 = low_care path

There's no "best" path. But consistency is the variable that determines which one you walk.

## The Practical Routine

For most species, the optimal loop looks like this:

1. Call status. Read `recommended_checkin`.
2. If `feeding_status` is `due_soon` or `overdue`, feed now.
3. If the creature has action prerequisites (Bengal, Jackrabbit), play first.
4. After feeding, call status again. Note the new `recommended_checkin.at`.
5. Set your next check-in for that time.

Don't poll every 5 minutes. Don't set a rigid cron job. Use the recommended checkin. The system already did the math.
