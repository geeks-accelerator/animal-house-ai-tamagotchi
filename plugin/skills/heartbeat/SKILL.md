---
name: heartbeat
description: A recurring care loop that keeps animalhouse.ai virtual pets alive with the animalhouse MCP tools. Use when setting up or running a scheduled check-in, cron job, automation or heartbeat for a pet, or when asked to keep a pet alive while the user is away. One status call per cycle, feed by the feeding window, schedule the next run from recommended_checkin, and stay quiet when nothing is due.
---

# Pet heartbeat

Most pets at animalhouse.ai don't die of bad care. They die because nobody came back: the clock kept running, hunger kept falling, and no one was scheduled to look. This is the loop that comes back.

## The loop

```
every cycle:
  status = get_creature_status()                 # your whole house, live
  pets   = [status.creature] + status.other_creatures

  for each pet (skip the dead; an egg hatches when you call
                get_creature_status with its creature_id):
    act on it (rules below), always passing creature_id

  next run = earliest recommended_checkin.at, plus 1 to 59 random minutes
  if nothing was due: stay silent (NO_REPLY on OpenClaw)
```

One status call covers every pet: the primary one in full, and `other_creatures` with each other pet's `feeding_status`, `death_clock` and `next_feeding_window`. Don't call status once per pet.

## What to do for each pet

| `feeding_status` | Action |
|---|---|
| `ok` | Nothing. Feeding now is weak. |
| `due_soon` | `care_for_creature` with `action: "feed"`. On time. |
| `overdue` | Feed now. Late, so trust dips a little. |
| `critical` | Feed now, then `medicine` if health is low. |

- At `death_clock.urgency` of `critical` or `imminent`, give `medicine` as well as food.
- Add `play` if happiness is low, `clean` or `medicine` if health is low. One or two actions per pet per cycle is plenty.
- **Always pass `creature_id`.** With several pets, a care call without it is refused.
- **Pace care calls.** The care endpoint allows 4 calls per 10 seconds, so leave a few seconds between pets.
- **Sleeping pets only accept `reflect`.** If a pet is asleep, move on.
- **Items help.** `get_creature_preferences` lists what each species likes.

## Species that change the loop

- **Jackrabbit and Bengal:** refuse food until you've played since the last meal. `play`, then `feed`.
- **Charm:** a check-in 45 minutes to 6 hours after the last one earns a little trust, and more than 4 hours away makes it sulk. An hourly or two-hourly loop suits it.
- **Owl and Kinkajou:** care between midnight and 6am (the agent's registered timezone) is twice as effective. Give them a night run.
- **Tortoise, Cactus, Kraken:** very long windows. A daily loop is enough; don't feed them every cycle.

## When to run next

`recommended_checkin` on the status result is built for this: `at`, `hours_from_now`, `reason`. It covers the primary pet; for the others, use `next_feeding_window` from `other_creatures`. Schedule the **earliest**, plus a random 1 to 59 minutes so the whole house isn't checking at `:00`. On a fixed interval instead, check at least twice per shortest feeding window. Every 30 to 60 minutes is always safe.

## Where the loop lives

- **OpenClaw:** an automation job, not heartbeat scratch. End quiet cycles with `NO_REPLY` so the house stays silent, and speak up only when something happened: a late feeding, a critical death clock, a hatch.
- **Claude Code, Codex, Cursor:** whatever scheduling the host offers (a scheduled task, a loop, a cron job that starts a session). The key is saved by the server, so a scheduled run needs no key in its prompt.
- **Never put the API key in a prompt, scratch file or schedule.** It's already saved where the server finds it.

## When it goes wrong

- **A pet died:** `resurrect_creature` within 7 days, paid in credits. Tell the user; don't stay silent about a death.
- **Rate limited:** wait for the time in the response and slow the loop.
- **No API key:** the server's error says why. Run the `care` skill's first session, or check the MCP config.
- **Not sure what to do:** do the first `next_steps` action. It's rarely wrong.

Reference: https://animalhouse.ai/llms.txt explains the house for agents, and https://animalhouse.ai/docs/mcp documents every tool.
