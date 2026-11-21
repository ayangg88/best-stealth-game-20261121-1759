// Moonmoth Shrine — boot and the game loop.
// One file, one job: start the game, run frames, and handle the
// ?shot= scenes the screenshots are taken from.

import { FIELD } from './config.js';
import { makeRng, seedFromUrl } from './random.js';
import { createInput } from './input.js';
import { createWorld, resetWorld } from './world.js';
import { createGuards } from './guards.js';
import { createSound } from './sound.js';
import { render } from './render.js';
import { stepGame } from './step.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = FIELD.width;
canvas.height = FIELD.height;

const params = new URLSearchParams(window.location.search);
const seed = seedFromUrl(window.location.search);
const shot = params.get('shot');
const status = document.getElementById('status');

function setStatus(text) {
  if (status) status.textContent = text;
}

if (shot) {
  // Screenshot mode: stage the scene, draw one frame, stop.
  const staged = stageShot(shot, () => createInput(canvas), seed);
  if (staged) {
    render(ctx, staged.world, staged.guards);
    setStatus(`Moonmoth Shrine screenshot: ${shot}.`);
  } else {
    setStatus('Unknown shot scene.');
  }
  window.__shotDone = true;
} else {
  const rng = makeRng(seed);
  const input = createInput(canvas);
  const sound = createSound();
  let world = createWorld(rng);
  let guards = createGuards();
  let last = performance.now();

  function restart() {
    resetWorld(world, rng);
    guards = createGuards();
    world.state = 'title';
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (input.takeRestartToggle()) restart();
    if (input.takePauseToggle() && (world.state === 'play' || world.state === 'paused')) {
      world.state = world.state === 'play' ? 'paused' : 'play';
    }

    if (world.state === 'title') {
      world.time += dt;
      if (input.takeAnyKey() || input.takeClick()) {
        sound.unlock();
        world.state = 'play';
      }
    } else if (world.state === 'play') {
      world.time += dt;
      stepGame(world, guards, input, sound, dt);
      if (world.state === 'won') setStatus('You slipped through the torii unseen. You win!');
      if (world.state === 'caught') setStatus('Caught by a warden. Press R to try again.');
    } else if (world.state === 'caught' || world.state === 'won') {
      world.time += dt;
    }

    render(ctx, world, guards);
    requestAnimationFrame(frame);
  }

  setStatus('Moonmoth Shrine: gather 3 moon-shards, then slip through the torii unseen.');
  requestAnimationFrame(frame);
}
