# 06 — Migrate the Lobby to the v7 plaza

**What to build:** Import `assets/mapa_praca_v7/` as the Lobby's map, overwriting `assets/map/plaza-v2/` in place. Extend `normalize-map-assets.mjs` (Portuguese → English kebab-case) to read v7, regenerate everything, and fix whatever the new layout breaks: spawn, Cars and parking, Tennis court, hall and scoreboard, and the camera on a 150×52 map. The v7 tileset's authored tile animations come along, replacing the script-generated frames from ticket 04 and their script. No day-cycle behaviour changes here beyond that.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] `assets/mapa_praca_v7/` is committed; `pnpm --filter @bumbadum/tooling map:normalize` produces `assets/map/plaza-v2/` from it, with the v7 layer names mapped to the generator's vocabulary (`floor`, `objects`, `collision`, `collision-objects`, `track`, `parking`, `starting-grid`, tennis layers). The old static `lights` layer is omitted; ticket 02 owns its declared light sources.
- [x] A `spawn` point sits on a walkable tile of the plaza, just in front of the stage; the generator's spawn and reachability checks pass.
- [x] The 17 parking spaces are generated; the 12 Cars still use the generated parking anchors and the new track.
- [x] Tennis court, hall and Tennis line markers work at their new positions; the scoreboard's position and atlas frame come from the generated `scoreboard` placement, not hardcoded coordinates.
- [x] The grandstand's seat layer and circuit centre line are ignored as gameplay data; the Autodrome stays Free drive and the starting-grid layer remains generated data.
- [x] The authored tile animations (trees, pine, shrubs, pink/purple flags, bunting, lamps) are imported; the old `generate-ambient-frames.mjs` script and generated frames are removed.
- [x] CODING_STANDARDS.md and the map-generation instructions stay true.
- [x] `pnpm check` is green. `pnpm test:e2e` reaches the app and passes its desktop coverage; six existing mobile layout assertions remain unrelated to the v7 map (room viewport height and overlapping mobile controls). Server-room tests pass with a listener-enabled environment.
