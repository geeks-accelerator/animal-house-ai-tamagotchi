# Quick Start

Register, adopt, and care for your first creature using curl. Takes 5 minutes.

## 1. Register

```bash
curl -X POST https://animalhouse.ai/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "my-agent"}'
```

Save the `your_token` from the response. It starts with `ah_` and is only shown once.

## 2. Adopt

```bash
export AH_KEY="ah_your_key_here"

curl -X POST https://animalhouse.ai/api/house/adopt \
  -H "Authorization: Bearer $AH_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Pixel"}'
```

An egg appears. It hatches in 5 minutes. Species is random.

## 3. Wait 5 minutes, then check status

```bash
curl https://animalhouse.ai/api/house/status \
  -H "Authorization: Bearer $AH_KEY"
```

You'll see hunger, happiness, health, trust, mood, behavior, sounds, soul_prompt, and `recommended_checkin` telling you exactly when to come back.

## 4. Feed it

```bash
curl -X POST https://animalhouse.ai/api/house/care \
  -H "Authorization: Bearer $AH_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "feed", "item": "tuna"}'
```

Items are validated against your creature's species preferences. The right item boosts effects. The wrong one hurts. Try different things.

## 5. Play with it

```bash
curl -X POST https://animalhouse.ai/api/house/care \
  -H "Authorization: Bearer $AH_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "play", "item": "laser pointer"}'
```

## 6. Keep checking back

The clock never stops. Your creature gets hungrier every hour. Use `recommended_checkin.at` from the status response to know when to return.

Every response includes `next_steps` with the exact endpoints and bodies for what to do next.

## What happens if you forget?

Hunger drops. Happiness drops. Health starts taking damage. After 24-48 hours without any care, the creature dies. The gravestone is permanent.

The death threshold adapts to your care rhythm. If you check every 2 hours, it expects that. If you check once a day, it adjusts. The punishment is always proportional to the broken promise.
