// Moonmoth Shrine — the level and its rules.
// One file, one job: walls, hedges, lanterns, grass, shards, the
// torii exit, pebbles, and the alarm meter. Guards live in guards.js.

import { FIELD, PLAYER, LEVEL, PEBBLE, GUARD } from './config.js';

// True when point (x, y) lies inside rect r.
export function insideRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// Do the segments (x1,y1)-(x2,y2) and (x3,y3)-(x4,y4) cross?
export function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
  const d2 = (x4 - x3) * (y2 - y3) - (y4 - y3) * (x2 - x3);
  const d3 = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
  const d4 = (x2 - x1) * (y4 - y1) - (y2 - y1) * (x4 - x1);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

// True when the segment between two points crosses rect r.
export function segmentHitsRect(x1, y1, x2, y2, r) {
  if (insideRect(x1, y1, r) || insideRect(x2, y2, r)) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  return edges.some(([ax, ay, bx, by]) => segmentsCross(x1, y1, x2, y2, ax, ay, bx, by));
}

// Every rectangle that blocks sight: hedges, walls, and the stone
// lanterns as small squares around their centres.
export function sightBlockers() {
  const blocks = [...LEVEL.hedges, ...LEVEL.walls];
  for (const lamp of LEVEL.lanterns) {
    const r = LEVEL.lanternBlockRadius;
    blocks.push({ x: lamp.x - r, y: lamp.y - r, w: r * 2, h: r * 2 });
  }
  return blocks;
}

// Every rectangle that blocks movement: hedges, walls, lanterns,
// and the garden's outer border.
export function solidRects() {
  const solids = [...sightBlockers()];
  const w = FIELD.wall;
  solids.push({ x: -w, y: -w, w: FIELD.width + 2 * w, h: w });
  solids.push({ x: -w, y: FIELD.height, w: FIELD.width + 2 * w, h: w });
  solids.push({ x: -w, y: 0, w: w, h: FIELD.height });
  solids.push({ x: FIELD.width, y: 0, w: w, h: FIELD.height });
  return solids;
}

// Move a circle of `radius` by (dx, dy), sliding along solids.
export function moveCircle(pos, dx, dy, radius, solids) {
  const next = { x: pos.x, y: pos.y };
  next.x += dx;
  for (const r of solids) {
    if (
      next.x + radius > r.x && next.x - radius < r.x + r.w &&
      next.y + radius > r.y && next.y - radius < r.y + r.h
    ) {
      next.x = dx > 0 ? r.x - radius : r.x + r.w + radius;
    }
  }
  next.y += dy;
  for (const r of solids) {
    if (
      next.x + radius > r.x && next.x - radius < r.x + r.w &&
      next.y + radius > r.y && next.y - radius < r.y + r.h
    ) {
      next.y = dy > 0 ? r.y - radius : r.y + r.h + radius;
    }
  }
  return next;
}

export function createWorld(rng) {
  // Fireflies drift over the garden; their places come from the seed.
  const fireflies = [];
  for (let i = 0; i < 42; i++) {
    fireflies.push({
      x: 30 + rng() * (FIELD.width - 60),
      y: 30 + rng() * (FIELD.height - 60),
      phase: rng() * Math.PI * 2,
      speed: 0.4 + rng() * 0.8,
    });
  }

  return {
    time: 0,
    // title | play | paused | caught | won
    state: 'title',
    player: { x: PLAYER.startX, y: PLAYER.startY, facing: -Math.PI / 2, moving: false, sneaking: false },
    shards: LEVEL.shards.map((s) => ({ ...s, taken: false })),
    shardsTaken: 0,
    pebbles: PEBBLE.count,
    // A pebble in flight: {x, y, tx, ty, t}; then a landed marker.
    pebbleFlight: null,
    pebbleLanded: null,
    alarm: 0,
    everAlarmed: false,
    winTime: 0,
    fireflies,
    solids: solidRects(),
    blocks: sightBlockers(),
  };
}

export function resetWorld(world, rng) {
  const fresh = createWorld(rng);
  Object.assign(world, fresh);
}

// Is the moth inside a hedge or tall grass right now?
export function isHidden(world) {
  const { x, y } = world.player;
  return (
    LEVEL.hedges.some((h) => insideRect(x, y, h)) ||
    LEVEL.grass.some((g) => insideRect(x, y, g))
  );
}

// Is the moth standing in a lantern's warm pool of light?
export function isInLight(world) {
  const { x, y } = world.player;
  return LEVEL.lanterns.some(
    (lamp) => Math.hypot(x - lamp.x, y - lamp.y) < LEVEL.lanternLightRadius,
  );
}

// Is the moth slowed by tall grass underfoot?
export function inGrass(world) {
  const { x, y } = world.player;
  return LEVEL.grass.some((g) => insideRect(x, y, g));
}

// The nearest grass or hedge the moth can duck into, for the
// autopilot's retreats. Falls back to the start corner.
export function nearestHidingSpot(world) {
  const { x, y } = world.player;
  let best = null;
  let bestDist = Infinity;
  const spots = [
    ...LEVEL.grass.map((g) => ({ x: g.x + g.w / 2, y: g.y + g.h / 2 })),
    ...LEVEL.hedges.map((h) => ({ x: h.x + h.w / 2, y: h.y + h.h / 2 })),
  ];
  for (const spot of spots) {
    const d = Math.hypot(spot.x - x, spot.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = spot;
    }
  }
  return best || { x: PLAYER.startX, y: PLAYER.startY };
}

// Pick up any shard the moth touches; returns true on a pickup.
export function collectShards(world) {
  let picked = false;
  for (const shard of world.shards) {
    if (shard.taken) continue;
    const d = Math.hypot(world.player.x - shard.x, world.player.y - shard.y);
    if (d < LEVEL.shardPickupRadius) {
      shard.taken = true;
      world.shardsTaken += 1;
      picked = true;
    }
  }
  return picked;
}

// True when the moth stands in the torii with every shard held.
export function atExit(world) {
  if (world.shardsTaken < LEVEL.shards.length) return false;
  const { x, y } = world.player;
  return insideRect(x, y, LEVEL.exit);
}

// Start a pebble toss toward (tx, ty); returns false with none left.
export function tossPebble(world, tx, ty) {
  if (world.pebbles <= 0 || world.pebbleFlight) return false;
  world.pebbles -= 1;
  world.pebbleFlight = { sx: world.player.x, sy: world.player.y, x: world.player.x, y: world.player.y, tx, ty, t: 0 };
  return true;
}

// Advance a pebble in flight; on landing, leave a marker for the
// guards to investigate. Returns 'landed' on the landing frame.
export function stepPebble(world, dt) {
  const flight = world.pebbleFlight;
  if (!flight) return null;
  flight.t += dt / PEBBLE.flySeconds;
  if (flight.t >= 1) {
    world.pebbleFlight = null;
    world.pebbleLanded = { x: flight.tx, y: flight.ty, age: 0 };
    return 'landed';
  }
  const eased = flight.t * flight.t * (3 - 2 * flight.t);
  flight.x = flight.sx + (flight.tx - flight.sx) * eased;
  flight.y = flight.sy + (flight.ty - flight.sy) * eased;
  return null;
}

// Age the landed-pebble marker away once the guards have looked.
export function agePebbleMarker(world, dt) {
  if (!world.pebbleLanded) return;
  world.pebbleLanded.age += dt;
  if (world.pebbleLanded.age > GUARD.investigateSeconds + 1.5) {
    world.pebbleLanded = null;
  }
}
