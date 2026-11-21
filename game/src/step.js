// Moonmoth Shrine — one frame of play.
// One file, one job: advance the world a single step. The live loop
// in main.js and the screenshot autopilot in shots.js both call it,
// so a staged screenshot plays by exactly the game's own rules.

import { PLAYER, LEVEL } from './config.js';
import {
  moveCircle,
  collectShards,
  atExit,
  tossPebble,
  stepPebble,
  agePebbleMarker,
  inGrass,
} from './world.js';
import { stepGuards, investigatePebble, maxSuspicion } from './guards.js';

export function stepGame(world, guards, input, sound, dt) {
  if (world.state !== 'play') return;

  const player = world.player;
  const move = input.moveVector();
  const sneaking = input.sneaking();
  player.sneaking = sneaking;
  player.moving = move.x !== 0 || move.y !== 0;

  if (player.moving) {
    let speed = sneaking ? PLAYER.sneakSpeed : PLAYER.runSpeed;
    if (inGrass(world)) speed *= 0.7;
    const next = moveCircle(
      player,
      move.x * speed * dt,
      move.y * speed * dt,
      PLAYER.radius,
      world.solids,
    );
    player.x = next.x;
    player.y = next.y;
    player.facing = Math.atan2(move.y, move.x);
    if (sound) sound.step(sneaking, dt);
  }

  // A click tosses a pebble toward the mouse.
  const click = input.takeClick();
  if (click && tossPebble(world, click.x, click.y) && sound) {
    sound.pebble();
  }
  if (stepPebble(world, dt) === 'landed') {
    investigatePebble(guards, world);
  }
  agePebbleMarker(world, dt);

  const events = stepGuards(guards, world, dt);
  if (events.includes('alarm') && sound) sound.spotted();
  if (events.includes('caught')) {
    world.state = 'caught';
    if (sound) sound.caught();
    return;
  }

  if (collectShards(world) && sound) sound.shard();

  if (atExit(world)) {
    world.state = 'won';
    world.winTime = world.time;
    if (sound) sound.win();
  }

  if (sound) sound.setSuspicion(maxSuspicion(guards));
}
