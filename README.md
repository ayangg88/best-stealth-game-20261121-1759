# Moonmoth Shrine

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/ayangg88/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/ayangg88/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

A moth-spirit sneaks through a lantern-lit shrine garden. Gather 3 moon-shards, then slip through the torii gate unseen.

Built for the [make.fun best stealth game bounty](https://make.fun/bounty/best-stealth-game-20261121-1759). Referral code: `ye9vf8mj`.

## How to play

Serve the game and open it in a desktop browser:

```sh
node serve.ts --port 8091
# open http://localhost:8091
```

- **WASD / arrow keys** — move
- **SHIFT** — sneak: slow, silent, harder to spot
- **Click** — toss a pebble (3 per run) to lure a warden to the landing spot
- **P** — pause, **R** — restart

Four stone-lantern wardens patrol the garden with sweeping cones of sight. Hedges and tall grass hide you; lantern light betrays you — standing in the warm pools fills a warden's suspicion faster, while shadow slows it. Get spotted and a warden chases for 4 seconds; get touched and you're caught. Running is faster but loud: wardens nearby hear it.

Collect all 3 moon-shards to open the torii gate, then reach it. Finish without ever raising the alarm for the Unseen bonus.

## How it is built

Plain static files under `game/` — no build step, no network requests, no libraries. `main.ts` (Node 22, stdlib only) copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library.

| File | Job |
| --- | --- |
| `game/src/config.js` | Tuning numbers and the level layout |
| `game/src/random.js` | Seeded RNG (`?seed=`) |
| `game/src/input.js` | Keyboard + mouse |
| `game/src/world.js` | Walls, hedges, lanterns, grass, shards, exit, pebbles |
| `game/src/guards.js` | Patrols, vision cones, suspicion, chases, investigations |
| `game/src/sound.js` | WebAudio footsteps, suspicion hum, chimes |
| `game/src/render.js` | All drawing: garden, cones, HUD, screens |
| `game/src/shots.js` | Staged screenshot scenes + autopilot |
| `game/src/step.js` | One frame of play, shared by the loop and the autopilot |
| `game/src/main.js` | Boot, game loop, `?shot=` handling |

Screenshots are real renders of the game's own code, staged deterministically with `?shot=start|play|end&seed=1` (see `shots.json`).

## License

MIT — see [LICENSE](LICENSE).
