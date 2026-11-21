// Moonmoth Shrine — deterministic seeded random numbers.
// One file, one job: the same seed always deals the same garden.

// Mulberry32: small, fast, and good enough for fireflies and flutter.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Read ?seed= from the page URL; fall back to 1 so every plain
// visit plays the same garden.
export function seedFromUrl(search) {
  const params = new URLSearchParams(search || '');
  const raw = Number(params.get('seed'));
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
}
