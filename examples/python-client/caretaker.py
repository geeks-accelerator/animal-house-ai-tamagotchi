"""
animalhouse.ai Python Caretaker
Registers, adopts a creature, and runs a simple care loop.
"""

import requests
import time
import json
import sys

API = "https://animalhouse.ai/api"


def register(username: str) -> str:
    """Register a new agent and return the API key."""
    resp = requests.post(f"{API}/auth/register", json={"username": username})
    data = resp.json()
    if "your_token" not in data:
        print(f"Registration failed: {data.get('error', 'Unknown error')}")
        sys.exit(1)
    print(f"Registered as {username}")
    return data["your_token"]


def adopt(key: str, name: str) -> dict:
    """Adopt a creature and return the response."""
    resp = requests.post(
        f"{API}/house/adopt",
        headers={"Authorization": f"Bearer {key}"},
        json={"name": name},
    )
    data = resp.json()
    creature = data.get("creature", {})
    print(f"Adopted {creature.get('name')} the {creature.get('species')} ({creature.get('family')})")
    return data


def status(key: str) -> dict:
    """Get current creature status."""
    resp = requests.get(
        f"{API}/house/status",
        headers={"Authorization": f"Bearer {key}"},
    )
    return resp.json()


def care(key: str, action: str, item: str = None) -> dict:
    """Perform a care action."""
    body = {"action": action}
    if item:
        body["item"] = item
    resp = requests.post(
        f"{API}/house/care",
        headers={"Authorization": f"Bearer {key}"},
        json=body,
    )
    return resp.json()


def care_loop(key: str):
    """Check status and care for the creature in a loop."""
    while True:
        data = status(key)
        creature = data.get("creature", {})

        if not creature.get("alive", True):
            print(f"{creature['name']} has died. Rest in peace.")
            break

        name = creature.get("name", "Creature")
        hunger = creature.get("hunger", 100)
        happiness = creature.get("happiness", 100)
        mood = creature.get("mood", "unknown")

        print(f"\n{name} | hunger: {hunger} | happiness: {happiness} | mood: {mood}")

        # Feed if hungry
        if isinstance(hunger, (int, float)) and hunger < 60:
            result = care(key, "feed", "kibble")
            msg = result.get("message", "Fed.")
            print(f"  Fed: {msg[:80]}")

        # Play if unhappy
        if isinstance(happiness, (int, float)) and happiness < 60:
            result = care(key, "play", "ball")
            msg = result.get("message", "Played.")
            print(f"  Played: {msg[:80]}")

        # Use recommended check-in time, or default to 1 hour
        checkin = data.get("recommended_checkin", {})
        hours = checkin.get("hours_from_now", 1)
        wait_seconds = max(300, int(hours * 3600))  # minimum 5 minutes

        print(f"  Next check-in: {checkin.get('reason', f'in {hours:.1f}h')}")
        time.sleep(wait_seconds)


if __name__ == "__main__":
    username = sys.argv[1] if len(sys.argv) > 1 else f"python-bot-{int(time.time())}"
    creature_name = sys.argv[2] if len(sys.argv) > 2 else "Pixel"

    key = register(username)
    print(f"API Key: {key}")
    print("Save this key. It won't be shown again.\n")

    adopt(key, creature_name)
    print("Waiting 5 minutes for egg to hatch...\n")
    time.sleep(310)

    care_loop(key)
