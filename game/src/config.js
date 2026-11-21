// Moonmoth Shrine — tuning and level layout.
// One file, one job: every number the game balances on lives here.

export const FIELD = { width: 1280, height: 720, wall: 24 };

export const PLAYER = {
  radius: 13,
  runSpeed: 168,
  sneakSpeed: 76,
  startX: 80,
  startY: 660,
  // Running is loud: guards inside this ring hear it.
  noiseRadius: 130,
};

export const CONE = {
  // Half-angle of a guard's vision cone, in radians.
  halfAngle: 0.61,
  range: 235,
  // How fast suspicion fills when the moth is seen, per second.
  // Nearer = faster; scaled by light and by sneaking.
  fillNear: 1.05,
  fillFar: 0.34,
  // Suspicion drains this fast per second while unseen.
  decay: 0.28,
  // Sneaking roughly halves how fast a guard grows suspicious.
  sneakFactor: 0.45,
  // Lantern light makes the moth easier to spot; shadow hides it.
  lightFactor: 1.6,
  shadowFactor: 0.55,
  // A guard almost on top of a hiding moth still spots it.
  hiddenSpotRange: 72,
  hiddenFill: 1.25,
};

export const GUARD = {
  radius: 16,
  patrolSpeed: [56, 66, 60, 72],
  chaseSpeed: 152,
  investigateSpeed: 92,
  chaseSeconds: 4,
  investigateSeconds: 3,
  catchRadius: 26,
  // While a guard chases, the alarm meter climbs this fast per second.
  alarmRise: 0.22,
  alarmFall: 0.05,
};

// The shrine garden, in world coordinates. Hedges and walls block
// movement and sight; lanterns block sight and pool warm light;
// grass hides the moth and slows it a little.
export const LEVEL = {
  // {x, y, w, h} rectangles. Hedges hide the moth inside them.
  hedges: [
    { x: 300, y: 120, w: 40, h: 300 },
    { x: 560, y: 300, w: 40, h: 300 },
    { x: 820, y: 120, w: 40, h: 300 },
    { x: 380, y: 480, w: 180, h: 40 },
    { x: 640, y: 480, w: 120, h: 40 },
    { x: 900, y: 300, w: 240, h: 40 },
  ],
  // Stone walls: block movement and sight, no hiding inside.
  walls: [
    { x: 200, y: 240, w: 220, h: 24 },
    { x: 860, y: 480, w: 220, h: 24 },
  ],
  // Stone lanterns: {x, y} centres; light pools around each one.
  lanterns: [
    { x: 220, y: 180 },
    { x: 480, y: 300 },
    { x: 760, y: 180 },
    { x: 1000, y: 480 },
    { x: 420, y: 620 },
    { x: 1120, y: 220 },
  ],
  lanternLightRadius: 150,
  lanternBlockRadius: 16,
  // Tall grass: hides the moth, slows it to 70% while inside.
  grass: [
    { x: 150, y: 300, w: 120, h: 90 },
    { x: 660, y: 560, w: 140, h: 90 },
    { x: 950, y: 120, w: 130, h: 90 },
    { x: 420, y: 120, w: 120, h: 80 },
  ],
  // Moon-shards to collect, in the order the garden suggests.
  shards: [
    { x: 180, y: 600 },
    { x: 640, y: 150 },
    { x: 1080, y: 560 },
  ],
  shardRadius: 15,
  shardPickupRadius: 26,
  // The torii gate: the exit, locked until all three shards are held.
  exit: { x: 1140, y: 32, w: 110, h: 78 },
  // Guard patrol loops: lists of waypoints each warden walks in turn.
  patrols: [
    [
      { x: 200, y: 120 },
      { x: 600, y: 120 },
      { x: 600, y: 220 },
      { x: 200, y: 220 },
    ],
    [
      { x: 700, y: 300 },
      { x: 1100, y: 300 },
      { x: 1100, y: 420 },
      { x: 700, y: 420 },
    ],
    [
      { x: 120, y: 480 },
      { x: 480, y: 480 },
      { x: 480, y: 640 },
      { x: 120, y: 640 },
    ],
    [
      { x: 900, y: 90 },
      { x: 900, y: 260 },
      { x: 1120, y: 260 },
      { x: 1120, y: 90 },
    ],
  ],
};

// Pebbles: a click tosses one toward the mouse; the nearest warden
// in range walks over to look at where it landed.
export const PEBBLE = {
  count: 3,
  flySeconds: 0.38,
  hearRadius: 380,
};

export const SHOTS = {
  playSeconds: 26,
  titleSeconds: 5,
};
