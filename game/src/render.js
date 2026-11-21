// Moonmoth Shrine — everything the eye sees.
// One file, one job: draw the garden, the wardens and their cones,
// the moth, the HUD, and the title / caught / win screens.

import { FIELD, LEVEL, CONE } from './config.js';
import { isHidden, isInLight } from './world.js';
import { maxSuspicion } from './guards.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawGround(ctx) {
  const grad = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  grad.addColorStop(0, '#171d42');
  grad.addColorStop(1, '#0e1236');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // Faint stone path tiles, so the garden reads as a place.
  ctx.strokeStyle = 'rgba(160, 170, 220, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 40; x < FIELD.width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, FIELD.height);
    ctx.stroke();
  }
  for (let y = 40; y < FIELD.height; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(FIELD.width, y);
    ctx.stroke();
  }
  // Outer stone border.
  ctx.strokeStyle = '#3a4066';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, FIELD.width - 6, FIELD.height - 6);
}

function drawGrass(ctx) {
  for (const g of LEVEL.grass) {
    ctx.fillStyle = '#1d4a3a';
    roundRect(ctx, g.x, g.y, g.w, g.h, 12);
    ctx.fill();
    ctx.strokeStyle = '#2e6b52';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 10; i++) {
      const bx = g.x + 8 + ((i * 37) % (g.w - 16));
      const by = g.y + 10 + ((i * 53) % (g.h - 20));
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + 3, by - 9);
      ctx.moveTo(bx + 6, by);
      ctx.lineTo(bx + 8, by - 7);
      ctx.stroke();
    }
  }
}

function drawHedgesAndWalls(ctx) {
  for (const h of LEVEL.hedges) {
    ctx.fillStyle = '#14301f';
    roundRect(ctx, h.x, h.y, h.w, h.h, 10);
    ctx.fill();
    ctx.fillStyle = '#1e4d2e';
    for (let i = 0; i < Math.floor(h.w * h.h / 900); i++) {
      const bx = h.x + 6 + ((i * 29) % (h.w - 12));
      const by = h.y + 6 + ((i * 41) % (h.h - 12));
      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  for (const w of LEVEL.walls) {
    ctx.fillStyle = '#4a4f6e';
    roundRect(ctx, w.x, w.y, w.w, w.h, 4);
    ctx.fill();
    ctx.fillStyle = '#5d6284';
    ctx.fillRect(w.x + 6, w.y + 5, w.w - 12, 3);
  }
}

function drawLanternLight(ctx) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const lamp of LEVEL.lanterns) {
    const grad = ctx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, LEVEL.lanternLightRadius);
    grad.addColorStop(0, 'rgba(255, 190, 90, 0.20)');
    grad.addColorStop(1, 'rgba(255, 190, 90, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, LEVEL.lanternLightRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawLanterns(ctx) {
  for (const lamp of LEVEL.lanterns) {
    ctx.fillStyle = '#2c2f45';
    ctx.fillRect(lamp.x - 9, lamp.y - 14, 18, 28);
    ctx.fillStyle = '#ffc46b';
    ctx.fillRect(lamp.x - 6, lamp.y - 8, 12, 12);
    ctx.fillStyle = '#1a1c2e';
    ctx.fillRect(lamp.x - 11, lamp.y - 18, 22, 5);
    ctx.fillRect(lamp.x - 11, lamp.y + 13, 22, 4);
  }
}

function drawExit(ctx, world, time) {
  const e = LEVEL.exit;
  const open = world.shardsTaken >= LEVEL.shards.length;
  // A warm pool of light on the ground marks the gate as a place
  // in the world, not a piece of the HUD.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const pool = ctx.createRadialGradient(
    e.x + e.w / 2, e.y + e.h, 4,
    e.x + e.w / 2, e.y + e.h, 66,
  );
  pool.addColorStop(0, open ? 'rgba(255, 190, 90, 0.22)' : 'rgba(255, 190, 90, 0.10)');
  pool.addColorStop(1, 'rgba(255, 190, 90, 0)');
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.ellipse(e.x + e.w / 2, e.y + e.h, 66, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Torii gate: two pillars and two lintels, vermilion against the night.
  ctx.fillStyle = open ? '#e8483f' : '#7a3a36';
  ctx.fillRect(e.x + 6, e.y + 14, 10, e.h - 14);
  ctx.fillRect(e.x + e.w - 16, e.y + 14, 10, e.h - 14);
  ctx.fillRect(e.x, e.y, e.w, 9);
  ctx.fillRect(e.x + 8, e.y + 16, e.w - 16, 6);
  if (open) {
    const pulse = 0.5 + 0.3 * Math.sin(time * 3);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const grad = ctx.createRadialGradient(
      e.x + e.w / 2, e.y + e.h / 2, 4,
      e.x + e.w / 2, e.y + e.h / 2, 70,
    );
    grad.addColorStop(0, `rgba(255, 220, 130, ${0.35 * pulse})`);
    grad.addColorStop(1, 'rgba(255, 220, 130, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(e.x + e.w / 2, e.y + e.h / 2, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT OPEN', e.x + e.w / 2, e.y + e.h + 16);
  } else {
    ctx.fillStyle = '#c9c2a8';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🔒 ${world.shardsTaken}/3 SHARDS`, e.x + e.w / 2, e.y + e.h + 16);
  }
}

function drawShards(ctx, world, time) {
  for (const shard of world.shards) {
    if (shard.taken) continue;
    const bob = Math.sin(time * 2 + shard.x) * 3;
    const y = shard.y + bob;
    ctx.save();
    ctx.shadowColor = '#9fe8ff';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#cfeeff';
    ctx.beginPath();
    ctx.arc(shard.x, y, 9, Math.PI * 0.25, Math.PI * 1.35);
    ctx.arc(shard.x + 4, y - 1, 7, Math.PI * 1.3, Math.PI * 0.3, true);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(159, 232, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(shard.x, y, 14, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawPebble(ctx, world) {
  if (world.pebbleFlight) {
    const f = world.pebbleFlight;
    ctx.fillStyle = '#d8d2c0';
    ctx.beginPath();
    ctx.arc(f.x, f.y - 14 * Math.sin(Math.PI * Math.min(1, f.t)), 4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (world.pebbleLanded) {
    ctx.strokeStyle = 'rgba(216, 210, 192, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(world.pebbleLanded.x, world.pebbleLanded.y, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(world.pebbleLanded.x, world.pebbleLanded.y, 12, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawCone(ctx, guard) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const grad = ctx.createRadialGradient(guard.x, guard.y, 10, guard.x, guard.y, CONE.range);
  const hot = guard.suspicion > 0.55;
  const color = hot ? '255, 90, 60' : '255, 190, 80';
  const alpha = 0.17 + 0.18 * guard.suspicion;
  grad.addColorStop(0, `rgba(${color}, ${alpha + 0.08})`);
  grad.addColorStop(1, `rgba(${color}, 0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, CONE.range, guard.angle - CONE.halfAngle, guard.angle + CONE.halfAngle);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = `rgba(${color}, ${0.4 + 0.35 * guard.suspicion})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(
    guard.x + Math.cos(guard.angle - CONE.halfAngle) * CONE.range,
    guard.y + Math.sin(guard.angle - CONE.halfAngle) * CONE.range,
  );
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(
    guard.x + Math.cos(guard.angle + CONE.halfAngle) * CONE.range,
    guard.y + Math.sin(guard.angle + CONE.halfAngle) * CONE.range,
  );
  ctx.stroke();
}

function drawGuard(ctx, guard, time) {
  drawCone(ctx, guard);
  // Stone warden: a squat lantern-body with a warm glowing core,
  // ringed so it reads against the floor at a glance.
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.fillStyle = '#6a7099';
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3d4159';
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#565b7d';
  ctx.beginPath();
  ctx.arc(0, -3, 11, 0, Math.PI * 2);
  ctx.fill();
  const coreGlow = 0.55 + 0.45 * guard.suspicion;
  ctx.shadowColor = guard.state === 'chase' ? '#ff5a3c' : '#ffc46b';
  ctx.shadowBlur = 14 * coreGlow;
  ctx.fillStyle = guard.state === 'chase' ? '#ff6a4a' : '#ffd27a';
  ctx.beginPath();
  ctx.arc(Math.cos(guard.angle) * 5, Math.sin(guard.angle) * 5 - 2, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // "!" as suspicion fills, "?" while investigating a pebble.
  if (guard.state === 'investigate') {
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', guard.x, guard.y - 26);
  } else if (guard.suspicion > 0.3 || guard.state === 'chase') {
    ctx.fillStyle = guard.state === 'chase' ? '#ff6a4a' : '#ffd27a';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    const bounce = guard.state === 'chase' ? Math.sin(time * 10) * 2 : 0;
    ctx.fillText('!', guard.x, guard.y - 26 + bounce);
  }
  // Thin suspicion arc over the warden's head.
  if (guard.suspicion > 0.05 && guard.state === 'patrol') {
    ctx.strokeStyle = 'rgba(255, 210, 122, 0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 21, -Math.PI / 2, -Math.PI / 2 + guard.suspicion * Math.PI * 2);
    ctx.stroke();
  }
}

function drawPlayer(ctx, world, time) {
  const p = world.player;
  const hidden = isHidden(world);
  ctx.save();
  ctx.translate(p.x, p.y);
  // Soft glow: brighter in shadow, dimmer when the moth is lit.
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 34);
  glow.addColorStop(0, 'rgba(190, 220, 255, 0.35)');
  glow.addColorStop(1, 'rgba(190, 220, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  // Wings flap gently; faster while running.
  const flap = Math.sin(time * (p.moving && !p.sneaking ? 16 : 7)) * 0.45;
  ctx.rotate(p.facing + Math.PI / 2);
  ctx.fillStyle = hidden ? 'rgba(214, 228, 255, 0.55)' : '#e8eeff';
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.rotate(side * (0.5 + flap * 0.5));
    ctx.beginPath();
    ctx.ellipse(side * 9, -2, 10, 6, side * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Pale body and dark eyes.
  ctx.fillStyle = '#f4f6ff';
  ctx.beginPath();
  ctx.ellipse(0, 0, 5, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1c2e';
  ctx.beginPath();
  ctx.arc(-2, -7, 1.4, 0, Math.PI * 2);
  ctx.arc(2, -7, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Noise ring while running loud.
  if (p.moving && !p.sneaking) {
    ctx.strokeStyle = 'rgba(255, 220, 150, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 26 + (time * 40) % 60, 0, Math.PI * 2);
    ctx.stroke();
  }
  // "HIDDEN" tag while the garden covers the moth.
  if (hidden && world.state === 'play') {
    ctx.fillStyle = 'rgba(159, 232, 255, 0.9)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', p.x, p.y - 24);
  }
}

function drawFireflies(ctx, world) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const fly of world.fireflies) {
    const x = fly.x + Math.sin(world.time * fly.speed + fly.phase) * 12;
    const y = fly.y + Math.cos(world.time * fly.speed * 0.8 + fly.phase) * 10;
    const twinkle = 0.35 + 0.3 * Math.sin(world.time * 2 + fly.phase * 3);
    ctx.fillStyle = `rgba(190, 255, 170, ${twinkle})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHud(ctx, world, guards) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 10, 26, 0.72)';
  roundRect(ctx, 12, 12, 300, 46, 10);
  ctx.fill();
  ctx.fillStyle = '#cfeeff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`◐  MOON-SHARDS  ${world.shardsTaken}/3`, 26, 35);
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText(`●  PEBBLES  ${world.pebbles}`, 196, 35);

  // Alarm meter, top centre: fills while a warden chases.
  ctx.fillStyle = 'rgba(8, 10, 26, 0.72)';
  roundRect(ctx, FIELD.width / 2 - 130, 12, 260, 46, 10);
  ctx.fill();
  ctx.fillStyle = '#ff8a6a';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ALARM', FIELD.width / 2 - 96, 35);
  ctx.fillStyle = '#232744';
  roundRect(ctx, FIELD.width / 2 - 52, 25, 168, 14, 7);
  ctx.fill();
  ctx.fillStyle = world.alarm > 0.5 ? '#ff5a3c' : '#ffb03a';
  if (world.alarm > 0.02) {
    roundRect(ctx, FIELD.width / 2 - 52, 25, 168 * world.alarm, 14, 7);
    ctx.fill();
  }

  // Timer, top right.
  const seconds = Math.floor(world.time);
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  ctx.fillStyle = 'rgba(8, 10, 26, 0.72)';
  roundRect(ctx, FIELD.width - 132, 12, 120, 46, 10);
  ctx.fill();
  ctx.fillStyle = '#e8eeff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(clock, FIELD.width - 72, 35);

  // Bottom hint line, fading after the first seconds of play.
  if (world.state === 'play' && world.time < 14) {
    ctx.fillStyle = `rgba(232, 238, 255, ${Math.max(0, 0.85 - world.time * 0.05)})`;
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      'WASD / arrows to move  •  SHIFT to sneak  •  CLICK to toss a pebble  •  P pause  •  R restart',
      FIELD.width / 2, FIELD.height - 16,
    );
  }
  // Light / shadow readout: what the moth stands in right now.
  if (world.state === 'play') {
    ctx.fillStyle = isInLight(world) ? 'rgba(255, 200, 110, 0.9)' : 'rgba(159, 200, 255, 0.85)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(isInLight(world) ? '☀ IN LANTERN LIGHT — SEEN FASTER' : '☾ IN SHADOW — HARDER TO SPOT', 16, FIELD.height - 16);
  }
  ctx.restore();
  void maxSuspicion;
  void guards;
}

function veil(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
}

function centreText(ctx, text, y, font, color) {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, FIELD.width / 2, y);
}

function drawTitle(ctx, world) {
  veil(ctx, 'rgba(6, 8, 22, 0.55)');
  centreText(ctx, 'MOONMOTH SHRINE', 218, 'bold 64px Georgia, serif', '#f4ead2');
  centreText(ctx, 'a moth-spirit slips through a lantern-lit shrine garden', 268, 'italic 20px Georgia, serif', '#b9c4e8');
  centreText(ctx, 'Gather 3 moon-shards, then slip through the torii unseen.', 330, '17px sans-serif', '#e8eeff');
  centreText(ctx, 'Stone-lantern wardens patrol with sweeping cones of sight.', 358, '17px sans-serif', '#e8eeff');
  centreText(ctx, 'Hedges and tall grass hide you. Lantern light betrays you.', 386, '17px sans-serif', '#e8eeff');
  centreText(ctx, 'WASD / arrows — move      SHIFT — sneak, slow and silent', 452, '16px sans-serif', '#ffe9a8');
  centreText(ctx, 'CLICK — toss a pebble to lure a warden      P — pause      R — restart', 480, '16px sans-serif', '#ffe9a8');
  centreText(ctx, 'Press any key to begin', 560, 'bold 18px sans-serif', '#9fe8ff');
  void world;
}

function drawCaught(ctx, world) {
  veil(ctx, 'rgba(30, 6, 10, 0.66)');
  centreText(ctx, 'CAUGHT!', 300, 'bold 72px Georgia, serif', '#ff6a4a');
  centreText(ctx, 'A warden\'s lantern found the moth.', 360, '19px sans-serif', '#f4d8d2');
  centreText(ctx, `Moon-shards gathered: ${world.shardsTaken} / 3`, 410, '17px sans-serif', '#e8eeff');
  centreText(ctx, 'Press R to try the garden again', 470, 'bold 18px sans-serif', '#ffe9a8');
}

function drawWon(ctx, world) {
  veil(ctx, 'rgba(8, 14, 6, 0.62)');
  centreText(ctx, 'THE SHRINE IS YOURS', 250, 'bold 56px Georgia, serif', '#ffe9a8');
  const minutes = Math.floor(world.winTime / 60);
  const seconds = Math.floor(world.winTime % 60);
  centreText(ctx, `Through the torii in ${minutes}:${String(seconds).padStart(2, '0')} — all 3 moon-shards gathered`, 320, '19px sans-serif', '#e8eeff');
  centreText(
    ctx,
    world.everAlarmed ? 'The wardens were roused at least once.' : 'UNSEEN BONUS — no warden ever raised the alarm!',
    360,
    world.everAlarmed ? '17px sans-serif' : 'bold 19px sans-serif',
    world.everAlarmed ? '#e8eeff' : '#9fe8ff',
  );
  centreText(ctx, 'Press R to play again', 430, 'bold 18px sans-serif', '#ffe9a8');
}

function drawPaused(ctx) {
  veil(ctx, 'rgba(6, 8, 22, 0.6)');
  centreText(ctx, 'PAUSED', 340, 'bold 56px Georgia, serif', '#e8eeff');
  centreText(ctx, 'Press P to return to the garden', 400, '18px sans-serif', '#ffe9a8');
}

// The one entry point: draw the whole frame for this world.
export function render(ctx, world, guards) {
  const time = world.time;
  drawGround(ctx);
  drawGrass(ctx);
  drawLanternLight(ctx);
  drawHedgesAndWalls(ctx);
  drawLanterns(ctx);
  drawExit(ctx, world, time);
  drawShards(ctx, world, time);
  drawPebble(ctx, world);
  for (const guard of guards) drawGuard(ctx, guard, time);
  drawPlayer(ctx, world, time);
  drawFireflies(ctx, world);
  drawHud(ctx, world, guards);
  if (world.state === 'title') drawTitle(ctx, world);
  else if (world.state === 'caught') drawCaught(ctx, world);
  else if (world.state === 'won') drawWon(ctx, world);
  else if (world.state === 'paused') drawPaused(ctx);
}
