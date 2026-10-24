# 03 — Draw the plaza's floor and lights

**What to build:** Extend the generator to compose the floor image from the floor tile layer and tileset and to copy the light overlay into `apps/web/public/sprites/plaza/`. The game engine draws the floor beneath players and the lights above them, and the rectangle `drawMap` and its colours are removed.

**Blocked by:** 01

**Status:** resolved

- [x] The generated floor image matches the Tiled floor layer pixel for pixel, and `--check` covers it.
- [x] The engine loads the floor and lights, keeps nearest-neighbour scaling, and draws lights above players with an additive-style blend.
- [x] `drawMap` and the old map colours are gone.
- [x] `pnpm check` and `pnpm test:e2e` are green.
