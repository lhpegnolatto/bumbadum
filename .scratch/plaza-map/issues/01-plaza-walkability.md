# 01 — The plaza becomes the Lobby's walkable Map

**What to build:** Move the Tiled project into `assets/map/plaza/` with English names, make the chairs walkable and add the `spawn` point in Tiled, and generate `plaza-map.generated.ts` so the server and the client's step prediction both use the 60×40 plaza. The existing rectangle renderer draws the new grid for now, so the change is playable end to end.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] `assets/map/plaza/` holds the Tiled project with English kebab-case names; preview and redundant files and `refs/` are gone.
- [x] Chair tiles are walkable and a `spawn` point object exists in the collision source, edited in Tiled data, not special-cased in code.
- [x] `generate-map-assets.mjs` writes `plaza-map.generated.ts`, fails on a missing, out-of-bounds or blocked spawn point and on unreachable walkable tiles, and has a `--check` mode run by tests.
- [x] `lobbyMap` is the plaza; world tests cover size, spawn, reachability and the chair, stage and building spot checks.
- [x] `pnpm check` and `pnpm test:e2e` are green.
