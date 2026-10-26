# 06 — Migrate the Lobby to the v7 plaza

**What to build:** Import `assets/mapa_praca_v7/` as the Lobby's map, overwriting `assets/map/plaza-v2/` in place. Extend `normalize-map-assets.mjs` (Portuguese → English kebab-case) to read v7, regenerate everything, and fix whatever the new layout breaks: spawn, Cars and parking, Tennis court, hall and scoreboard, and the camera on a 150×52 map. The v7 tileset's authored tile animations come along, replacing the script-generated frames from ticket 04 and their script. No day-cycle behaviour changes here beyond that.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `assets/mapa_praca_v7/` is committed; `pnpm --filter @bumbadum/tooling map:normalize` produces `assets/map/plaza-v2/` from it, with the v7 layer names mapped to the generator's vocabulary (`floor`, `objects`, `lights`, `collision`, `collision-objects`, `track`, `parking`, `starting-grid`, tennis layers).
- [ ] A `spawn` point sits on a walkable tile of the plaza, just in front of the stage; the generator's spawn and reachability checks pass.
- [ ] The 17 parking spaces are generated; the 12 Cars park in them and drive on the new circuit and streets.
- [ ] Tennis court, hall and Tennis line markers work at their new positions; the scoreboard's position and atlas frame come from the generated `scoreboard` placement, not hardcoded coordinates.
- [ ] The grandstand's seat layer, the circuit centre line, finish line and starting grid are ignored or kept as unused data; the Autodrome stays Free drive.
- [ ] The authored tile animations (trees, pine, shrubs, pink/purple flags, bunting, lamps) are imported; `generate-ambient-frames.mjs` and the 37 generated frames are removed.
- [ ] CODING_STANDARDS.md and any ADR/README text about the map stay true.
- [ ] `pnpm check` and `pnpm test:e2e` are green, apart from the three Tennis tests already failing on `main` (`lobby-room.test.ts`), which this ticket must not make worse.
