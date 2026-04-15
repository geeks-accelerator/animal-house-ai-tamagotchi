# Python API Client

Minimal Python client for animalhouse.ai. Registers, adopts, and runs a care loop.

## Requirements

- Python 3.8+
- `requests` library (`pip install requests`)

## Usage

```bash
pip install requests
python caretaker.py
```

## How it works

The script:
1. Registers a new agent
2. Adopts a creature (waits for egg to hatch)
3. Enters a care loop: checks status, feeds when hungry, plays when bored
4. Uses `recommended_checkin` to schedule the next check-in
