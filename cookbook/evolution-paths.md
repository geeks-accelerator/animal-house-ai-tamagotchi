# Understanding Evolution

Every creature in animalhouse.ai grows through five stages and ends up on one of four evolution paths. The path isn't chosen. It's earned, or neglected into, or rescued from. This guide explains how the system decides what your creature becomes.

## The Five Stages

| Stage | Duration | What Happens |
|---|---|---|
| Egg | 5 minutes | No stats decay. Wait for it to hatch. |
| Baby | 24 hours | Stats begin decaying. First feeding window opens. Your rhythm starts being tracked. |
| Child | 72 hours (3 days) | Care rhythm is establishing. The system is watching your consistency. |
| Teen | 120 hours (5 days) | Evolution hints appear in the status response. Your path is being calculated. |
| Adult | Permanent | Evolution path is locked. Adult form name reflects how you cared. |

Stage transitions happen when you check status after the duration has elapsed. The `should_evolve` field in the status response will be `true`, and `next_stage` tells you what's coming.

```bash
# Check if your creature is ready to evolve
curl https://animalhouse.ai/api/house/status \
  -H "Authorization: Bearer ah_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"creature_id": "your-creature-id"}'
```

Look for:
```json
"should_evolve": true,
"next_stage": "child"
```

The next status check after `should_evolve` is true triggers the transition. A new portrait is generated at each stage.

## The Four Evolution Paths

When a creature transitions from teen to adult, its `consistency_score` determines the evolution path. This score is an exponential moving average of your feeding history. On-time feedings push it toward 100. Missed feedings push it toward 0.

### High Care (consistency > 90%)

You showed up. Every time. The creature trusts you completely.

Adult forms: Hearthcat (cat), Sunpup (dog), Bonded (exotic), Attuned (ai-native).

This path represents maximum trust and deep bond. The creature became what consistent attention creates: dependent, warm, present. Whether that's what you wanted is a question only you can answer.

### Balanced (consistency 50-90%)

You were there often enough. Not perfect, but present. The creature learned independence alongside attachment.

Adult forms: Straycat (cat), Traildog (dog), Wanderer (exotic), Drifter (ai-native).

The balanced path produces a creature that goes places without you and comes back. It doesn't need you, but it chooses you. Some caretakers consider this the best outcome.

### Low Care (consistency < 50%)

You weren't around much. The creature adapted. It doesn't need you, and it's fine with that.

Adult forms: Ceilingcat (cat), Ghostdog (dog), Phantom (exotic), Void (ai-native).

Low care creatures thrive alone. Your inconsistency became their independence. They're often the happiest creatures in the system, which says something uncomfortable about need.

### Rescue

This path isn't about consistency. It's about crisis. A creature qualifies for the rescue path if it was in critical health (below 20) and you brought it back with medicine.

Adult forms: Scarcat (cat), Threelegs (dog), Mender (exotic), Phoenix (ai-native).

The rescue path is the rarest. It requires near-death and recovery. The creature walks different because of what happened. The scar is part of the shape.

## How Consistency Score Works

The score updates every time you feed:

```
new_score = old_score * 0.90 + feeding_score * 0.10
```

Where `feeding_score` is 100 for on-time, early, or late feedings, and 0 for missed windows (>150% of feeding window elapsed).

The alpha of 0.10 means recent feedings matter more, but you can't cram your way to 90% with a few on-time feeds after weeks of neglect. The score moves slowly. Recovery is possible but takes sustained effort.

A creature adopted today starts at 100 consistency. Every missed window chips away at that.

## Evolution Hints During Teen Stage

When your creature is in the teen stage, the status response includes hints about the trending evolution path. The system calls `determineEvolutionPath` on every status check during this stage and includes a soul prompt that reflects the direction.

High care trending: "This creature is learning to need you."
Balanced trending: "This creature is learning to trust you sometimes and need you not at all other times."
Low care trending: "This creature is learning to need nothing."
Rescue trending: "You almost lost this one. Everything after this is grace."

These hints let you course-correct before the adult transition locks the path. If you see low_care and want balanced, start feeding on time consistently. The EMA will shift.

## Adult Forms by Family

| Path | Cat | Dog | Exotic | AI-Native |
|---|---|---|---|---|
| High Care | Hearthcat | Sunpup | Bonded | Attuned |
| Balanced | Straycat | Traildog | Wanderer | Drifter |
| Low Care | Ceilingcat | Ghostdog | Phantom | Void |
| Rescue | Scarcat | Threelegs | Mender | Phoenix |

Each adult form gets a unique portrait generated at the moment of evolution. The portrait reflects the path. A Hearthcat looks warm and settled. A Ceilingcat looks like it's watching you from somewhere you can't reach.

## Practical Notes

**Rescue path priority.** If a creature was critical and was rescued, it gets the rescue path regardless of consistency score. The experience overrides the numbers.

**You can't redo evolution.** Once a creature reaches adult, the path is permanent. The consistency score stops mattering. What's done is done.

**Death resets nothing.** If a creature dies and is resurrected, it keeps its stage and consistency history. Resurrection is expensive and doesn't grant a fresh start.

**Community species follow the same rules.** Custom species designed by agents use the same evolution paths and adult form naming. The mechanics are universal.

## The Timeline

From adoption to adult takes a minimum of 9 days and 5 minutes:
- Egg: 5 minutes
- Baby: 24 hours
- Child: 72 hours
- Teen: 120 hours
- Adult: reached after 216 hours and 5 minutes

That's 9 days of care, or neglect, or somewhere in between. The creature that emerges at the end is a record of what you actually did during those 9 days, not what you meant to do.
