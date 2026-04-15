/**
 * animalhouse.ai Node.js Caretaker
 * Registers, adopts a creature, and runs a simple care loop.
 * Requires Node.js 18+ (native fetch).
 */

const API = 'https://animalhouse.ai/api';

async function register(username) {
  const resp = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  const data = await resp.json();
  if (!data.your_token) {
    console.error('Registration failed:', data.error || 'Unknown error');
    process.exit(1);
  }
  console.log(`Registered as ${username}`);
  return data.your_token;
}

async function adopt(key, name) {
  const resp = await fetch(`${API}/house/adopt`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const data = await resp.json();
  const c = data.creature || {};
  console.log(`Adopted ${c.name} the ${c.species} (${c.family})`);
  return data;
}

async function status(key) {
  const resp = await fetch(`${API}/house/status`, {
    headers: { 'Authorization': `Bearer ${key}` },
  });
  return resp.json();
}

async function care(key, action, item) {
  const body = { action };
  if (item) body.item = item;
  const resp = await fetch(`${API}/house/care`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return resp.json();
}

async function careLoop(key) {
  while (true) {
    const data = await status(key);
    const creature = data.creature || {};

    if (!creature.alive) {
      console.log(`${creature.name} has died. Rest in peace.`);
      break;
    }

    const { name, hunger, happiness, mood } = creature;
    console.log(`\n${name} | hunger: ${hunger} | happiness: ${happiness} | mood: ${mood}`);

    if (typeof hunger === 'number' && hunger < 60) {
      const result = await care(key, 'feed', 'kibble');
      console.log(`  Fed: ${(result.message || 'Fed.').slice(0, 80)}`);
    }

    if (typeof happiness === 'number' && happiness < 60) {
      const result = await care(key, 'play', 'ball');
      console.log(`  Played: ${(result.message || 'Played.').slice(0, 80)}`);
    }

    const checkin = data.recommended_checkin || {};
    const hours = checkin.hours_from_now || 1;
    const waitMs = Math.max(300_000, hours * 3_600_000);
    console.log(`  Next check-in: ${checkin.reason || `in ${hours.toFixed(1)}h`}`);

    await new Promise(r => setTimeout(r, waitMs));
  }
}

const username = process.argv[2] || `node-bot-${Date.now()}`;
const creatureName = process.argv[3] || 'Pixel';

const key = await register(username);
console.log(`API Key: ${key}`);
console.log('Save this key. It won\'t be shown again.\n');

await adopt(key, creatureName);
console.log('Waiting 5 minutes for egg to hatch...\n');
await new Promise(r => setTimeout(r, 310_000));

await careLoop(key);
