// Moonmoth Shrine — the stone-lantern wardens.
// One file, one job: patrols, vision cones, suspicion, chases,
// and pebble investigations.

// Guard states: patrol | chase | investigate | return
import { CONE, GUARD, LEVEL, PEBBLE } from './config.js';
import { moveCircle, segmentHitsRect, isHidden, isInLight } from './world.js';

export function createGuards() {
  return LEVEL.patrols.map((waypoints, i) => ({
    waypoints,
    waypointIndex: 0,
    x: waypoints[0].x,
    y: waypoints[0].y,
    // Facing angle; starts along the first patrol leg.
    angle: Math.atan2(waypoints[1].y - waypoints[0].y, waypoints[1].x - waypoints[0].x),
    speed: GUARD.patrolSpeed[i % GUARD.patrolSpeed.length],
    state: 'patrol',
    suspicion: 0,
    chaseTimer: 0,
    investigateTimer: 0,
    investigateTarget: null,
    // Last seen moth position, for the chase.
    lastSeen: null,
  }));
}

// Can this guard see the moth right now? The moth must be inside
// the cone, inside range, and in a clear line of sight.
export function guardSeesPlayer(guard, world) {
  const player = world.player;
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONE.range) return { sees: false, dist };
  const toPlayer = Math.atan2(dy, dx);
  let diff = Math.abs(toPlayer - guard.angle);
  if (diff > Math.PI) diff = Math.PI * 2 - diff;
  if (diff > CONE.halfAngle) return { sees: false, dist };
  for (const block of world.blocks) {
    if (segmentHitsRect(guard.x, guard.y, player.x, player.y, block)) {
      return { sees: false, dist };
    }
  }
  return { sees: true, dist };
}

// How fast this guard's suspicion fills while it sees the moth.
function fillRate(guard, world, dist) {
  const near = 1 - Math.min(1, dist / CONE.range);
  let rate = CONE.fillFar + (CONE.fillNear - CONE.fillFar) * near;
  if (world.player.sneaking) rate *= CONE.sneakFactor;
  rate *= isInLight(world) ? CONE.lightFactor : CONE.shadowFactor;
  return rate;
}

// Walk toward a point at `speed`, sliding along solids.
function walkToward(guard, tx, ty, speed, dt, world) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  const next = moveCircle(guard, (dx / dist) * step, (dy / dist) * step, 14, world.solids);
  guard.x = next.x;
  guard.y = next.y;
  guard.angle = Math.atan2(dy, dx);
  return dist - step < 4;
}

// Step every guard one frame. Returns events the game loop reacts to:
// 'alarm' when a chase begins, 'caught' when a warden touches the moth.
export function stepGuards(guards, world, dt) {
  const events = [];
  const hidden = isHidden(world);
  const player = world.player;

  for (const guard of guards) {
    const { sees, dist } = guardSeesPlayer(guard, world);
    const canSee = sees && !(hidden && dist > CONE.hiddenSpotRange);

    if (guard.state === 'patrol') {
      if (canSee) {
        guard.suspicion += fillRate(guard, world, dist) * dt;
        guard.lastSeen = { x: player.x, y: player.y };
        if (guard.suspicion >= 1) {
          guard.suspicion = 1;
          guard.state = 'chase';
          guard.chaseTimer = GUARD.chaseSeconds;
          world.everAlarmed = true;
          events.push('alarm');
        }
      } else {
        guard.suspicion = Math.max(0, guard.suspicion - CONE.decay * dt);
      }
      // Walk the patrol loop, turning to face each leg.
      const target = guard.waypoints[guard.waypointIndex];
      if (walkToward(guard, target.x, target.y, guard.speed, dt, world)) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
      }
    } else if (guard.state === 'chase') {
      guard.chaseTimer -= dt;
      world.alarm = Math.min(1, world.alarm + GUARD.alarmRise * dt);
      if (canSee) guard.lastSeen = { x: player.x, y: player.y };
      const target = guard.lastSeen || { x: player.x, y: player.y };
      walkToward(guard, target.x, target.y, GUARD.chaseSpeed, dt, world);
      const touch = Math.hypot(player.x - guard.x, player.y - guard.y);
      if (touch < GUARD.catchRadius) events.push('caught');
      if (guard.chaseTimer <= 0) {
        guard.state = 'return';
        guard.suspicion = 0.35;
      }
    } else if (guard.state === 'investigate') {
      guard.investigateTimer -= dt;
      const target = guard.investigateTarget;
      if (target) walkToward(guard, target.x, target.y, GUARD.investigateSpeed, dt, world);
      guard.suspicion = Math.max(0, guard.suspicion - CONE.decay * dt);
      if (guard.investigateTimer <= 0) {
        guard.state = 'return';
        guard.investigateTarget = null;
      }
    } else if (guard.state === 'return') {
      // Walk back to the nearest waypoint, then resume the patrol.
      let nearest = 0;
      let nearestDist = Infinity;
      guard.waypoints.forEach((point, i) => {
        const d = Math.hypot(point.x - guard.x, point.y - guard.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = i;
        }
      });
      const target = guard.waypoints[nearest];
      if (walkToward(guard, target.x, target.y, guard.speed, dt, world)) {
        guard.waypointIndex = (nearest + 1) % guard.waypoints.length;
        guard.state = 'patrol';
      }
    }

    // A running moth is loud: wardens nearby grow suspicious.
    if (player.moving && !player.sneaking) {
      const d = Math.hypot(player.x - guard.x, player.y - guard.y);
      if (d < 130 && guard.state === 'patrol') {
        guard.suspicion = Math.min(1, guard.suspicion + 0.16 * dt);
      }
    }
  }

  // The alarm meter drains once no warden is chasing.
  if (!guards.some((g) => g.state === 'chase')) {
    world.alarm = Math.max(0, world.alarm - GUARD.alarmFall * dt);
  }
  return events;
}

// Send the nearest patrolling warden to look at a landed pebble.
export function investigatePebble(guards, world) {
  const landed = world.pebbleLanded;
  if (!landed) return false;
  let best = null;
  let bestDist = Infinity;
  for (const guard of guards) {
    if (guard.state !== 'patrol') continue;
    const d = Math.hypot(guard.x - landed.x, guard.y - landed.y);
    if (d < bestDist) {
      bestDist = d;
      best = guard;
    }
  }
  if (!best || bestDist > PEBBLE.hearRadius) return false;
  best.state = 'investigate';
  best.investigateTimer = GUARD.investigateSeconds;
  best.investigateTarget = { x: landed.x, y: landed.y };
  return true;
}

// The highest suspicion across wardens: drives the hum and the "!".
export function maxSuspicion(guards) {
  return guards.reduce((top, g) => Math.max(top, g.suspicion), 0);
}
