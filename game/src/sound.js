// Moonmoth Shrine — all sound, made from oscillators, no files.
// One file, one job: footsteps, the suspicion hum, and chimes.

// Footsteps tick as the moth moves; the hum under the garden rises
// with the most suspicious warden; pings mark being spotted and
// shards landing in the moth's wings.
export function createSound() {
  let ctx = null;
  let humOsc = null;
  let humGain = null;
  let stepTimer = 0;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
      humOsc = ctx.createOscillator();
      humOsc.type = 'sine';
      humOsc.frequency.value = 55;
      humGain = ctx.createGain();
      humGain.gain.value = 0;
      humOsc.connect(humGain);
      humGain.connect(ctx.destination);
      humOsc.start();
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function blip(freq, seconds, type, volume, slideTo) {
    if (!ensure()) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + seconds);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + seconds);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + seconds + 0.02);
    } catch {
      // Sound is garnish; a silent game is still a game.
    }
  }

  return {
    // Call on the first key or click so the browser lets audio start.
    unlock() {
      ensure();
    },
    // A soft tick every step while the moth moves; quicker running.
    step(sneaking, dt) {
      if (!ctx) return;
      stepTimer -= dt;
      if (stepTimer > 0) return;
      stepTimer = sneaking ? 0.42 : 0.26;
      blip(sneaking ? 620 : 440, 0.05, 'sine', sneaking ? 0.03 : 0.05, 300);
    },
    // The garden hum follows the highest suspicion: 0 = silent.
    setSuspicion(level) {
      if (!ctx || !humOsc || !humGain) return;
      try {
        humGain.gain.setTargetAtTime(level * 0.05, ctx.currentTime, 0.1);
        humOsc.frequency.setTargetAtTime(55 + level * 55, ctx.currentTime, 0.1);
      } catch {
        // Ignore audio errors.
      }
    },
    // Sharp ping when a warden's suspicion fills and the alarm starts.
    spotted() {
      blip(880, 0.18, 'square', 0.06, 1320);
    },
    // Two-note chime when a moon-shard is gathered.
    shard() {
      blip(660, 0.16, 'sine', 0.07);
      setTimeout(() => blip(990, 0.24, 'sine', 0.07), 90);
    },
    // Soft knock when a pebble lands and draws a warden over.
    pebble() {
      blip(300, 0.08, 'triangle', 0.06, 180);
    },
    // Low warm chord when the moth slips through the torii unseen.
    win() {
      blip(523, 0.4, 'sine', 0.06);
      setTimeout(() => blip(659, 0.4, 'sine', 0.06), 120);
      setTimeout(() => blip(784, 0.6, 'sine', 0.06), 240);
    },
    // Dull thud when a warden catches the moth.
    caught() {
      blip(140, 0.35, 'sawtooth', 0.07, 70);
    },
  };
}
