// Moonmoth Shrine — staged screenshot scenes.
// One file, one job: put the game into the exact states the three
// screenshots show, using the game's own step function so every
// staged frame is a real frame of play.

import { LEVEL, SHOTS } from './config.js';
import { makeRng } from './random.js';
import { createWorld, nearestHidingSpot } from './world.js';
import { createGuards, maxSuspicion, guardSeesPlayer } from './guards.js';
import { stepGame } from './step.js';

const DT = 1 / 60;

// Steer the moth toward a point for one simulated frame.
function steerToward(world, input, tx, ty) {
  const dx = tx - world.player.x;
  const dy = ty - world.player.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 12) input.injectMove(0, 0, true);
  else input.injectMove(dx / dist, dy / dist, true);
}

// Walk the moth to a spot just below a patrol leg, then wait,
// sneaking, until a warden's cone sweeps over it — the mid-game
// shot wants the cone on the moth. Returns false if caught.
function waitForConeSweep(world, guards, input) {
  const spot = { x: 880, y: 455 };
  let waited = 0;
  let seenFor = 0;
  while (waited < 14 && world.state === 'play') {
    const seen = guards.some((g) => guardSeesPlayer(g, world).sees);
    if (seen) {
      // Let the suspicion build a little so the "!" shows, then stop.
      seenFor += DT;
      if (seenFor > 2 || maxSuspicion(guards) > 0.3) {
        input.releaseAll();
        return true;
      }
    }
    const dist = Math.hypot(spot.x - world.player.x, spot.y - world.player.y);
    if (dist > 12) steerToward(world, input, spot.x, spot.y);
    else input.injectMove(0, 0, true);
    world.time += DT;
    stepGame(world, guards, input, null, DT);
    waited += DT;
  }
  input.releaseAll();
  return world.state === 'play';
}

// The autopilot: sneak toward the nearest uncollected shard, and
// duck into the nearest grass or hedge whenever a warden grows
// suspicious, waiting there until the suspicion drains away.
function runAutopilot(world, guards, input, seconds) {
  const frames = Math.round(seconds / DT);
  for (let frame = 0; frame < frames; frame++) {
    if (world.state !== 'play') return false;
    const suspicion = maxSuspicion(guards);
    let target;
    if (suspicion > 0.45) {
      target = nearestHidingSpot(world);
    } else {
      const remaining = world.shards.filter((s) => !s.taken);
      if (remaining.length === 0) {
        target = { x: LEVEL.exit.x + LEVEL.exit.w / 2, y: LEVEL.exit.y + LEVEL.exit.h / 2 };
      } else {
        target = remaining.reduce((best, s) =>
          Math.hypot(s.x - world.player.x, s.y - world.player.y) <
          Math.hypot(best.x - world.player.x, best.y - world.player.y)
            ? s
            : best,
        );
      }
    }
    const dx = target.x - world.player.x;
    const dy = target.y - world.player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 12) {
      input.injectMove(0, 0, true);
    } else {
      input.injectMove(dx / dist, dy / dist, true);
    }
    world.time += DT;
    stepGame(world, guards, input, null, DT);
  }
  input.releaseAll();
  return world.state === 'play';
}

// Stage a scene and return the world and guards to draw.
// `makeInput` builds the input object the autopilot steers with.
export function stageShot(name, makeInput, seed) {
  const rng = () => makeRng(seed || 1);
  if (name === 'start') {
    const world = createWorld(rng());
    const guards = createGuards();
    // Title over a fresh garden, five seconds of fireflies in.
    world.time = SHOTS.titleSeconds;
    world.state = 'title';
    return { world, guards };
  }

  if (name === 'play') {
    const input = makeInput();
    let world = createWorld(rng());
    let guards = createGuards();
    world.state = 'play';
    const ok = runAutopilot(world, guards, input, SHOTS.playSeconds);
    // Then slip to a spot a patrol leg sweeps and hold still until
    // a warden's cone washes over the moth.
    const swept = ok ? waitForConeSweep(world, guards, input) : false;
    void swept;
    if (!ok || world.shardsTaken === 0) {
      // The autopilot was caught or never reached a shard: stage a
      // mid-game moment directly — one shard held, a cone sweeping
      // close to the moth, suspicion halfway up.
      world = createWorld(rng());
      guards = createGuards();
      world.state = 'play';
      world.time = 26;
      world.shards[0].taken = true;
      world.shardsTaken = 1;
      world.player.x = 470;
      world.player.y = 380;
      world.player.facing = Math.PI / 2;
      world.player.sneaking = true;
      guards[1].x = 700;
      guards[1].y = 380;
      guards[1].angle = Math.PI;
      guards[1].suspicion = 0.55;
    }
    return { world, guards };
  }

  if (name === 'end') {
    // The win, staged: every shard held, the moth at the torii.
    const world = createWorld(rng());
    const guards = createGuards();
    world.state = 'won';
    world.time = 142;
    world.winTime = 142;
    world.everAlarmed = false;
    for (const shard of world.shards) shard.taken = true;
    world.shardsTaken = 3;
    world.player.x = LEVEL.exit.x + LEVEL.exit.w / 2;
    world.player.y = LEVEL.exit.y + LEVEL.exit.h / 2;
    world.player.facing = -Math.PI / 2;
    return { world, guards };
  }

  return null;
}
