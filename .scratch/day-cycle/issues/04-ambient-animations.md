# 04 — Ambient animations for trees, shrubs, flags and bunting

**What to build:** Trees (`tree-*`, `pine`), shrubs (`shrub`, `shrub-flower`), flags (`flag-*`) and bunting (`bunting`, `bunting-short`) loop through authored frames. A script generates the extra frames from the current images, and a human reviews them. The frames are declared as tile animations in `objects.tsj`. The generator packs every frame into the atlas and exports each object's frame list and durations. The engine advances each object with a phase derived from its position, so neighbours never move in unison.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] Starting timings: trees and shrubs 4 frames over ~2.4 s, flags and bunting 3 frames over ~0.5 s; tuned with a human in the prototype. (Starting timings in place; tuning with a human and a visual review of the frames are still to do.)
- [x] The generator exports animation frames and durations, and fails on a frame from another tileset.
- [x] A pure timeline returns the frame for a time and a phase, derives the phase from position, and holds the first frame under reduced motion. Unit-tested.
- [x] Depth order is unchanged: every frame keeps its object's base.
- [x] `pnpm check` is green. (Except three `lobby-room` Tennis tests in `apps/server` that already fail without this change.)

## Answer

- `packages/tooling/generate-ambient-frames.mjs` (`pnpm --filter @bumbadum/tooling map:v2:ambient-frames`) draws 37 frames next to the still images in `assets/map/plaza-v2/objects/`, each the size of its source, by moving pixels only (no blending):
  - Trees and shrubs (`<name>-1..3.png`): the canopy sways by one pixel, starting at the top: a slight lean right, a fuller lean right, a slight lean left. The trunk rows never move.
  - `flag-pink` and `flag-purple` (`-1..2`): the lower part of the banner swings right, then left. Full-width rows shift their shading inside the outline; the narrower tail moves whole.
  - `flag-checkered` (`-1..2`): a vertical wave runs along the cloth, growing away from the pole.
  - `bunting` and `bunting-short` (`-1..2`): the pennant tips swing, in a wave along the string.
- `objects.tsj` declares the frames as tile animations: 600 ms per frame for trees and shrubs (2.4 s), 170 ms for flags and bunting (0.51 s). The tileset grew from 77 to 114 tiles, so `plaza-v2.tmj` moved the collision tileset's `firstgid` from 1372 to 1409 and remapped its gids, as Tiled does when a tileset grows.
- `generate-map-assets.mjs` packs every frame into `objects.png` after the existing tiles, so earlier atlas positions do not move. Each animated object in `plaza-v2-objects.generated.ts` gets `animation: { frame, duration }[]`. The generator fails on a frame that is not in the objects tileset, a frame of another size, or a duration that is not a positive whole number. `@bumbadum/world`'s tests now also reject stale plaza-v2 output.
- `game-engine/src/sprites/ambient-animation.ts`: `ambientFrame(durations, now, phase, reducedMotion)` and `ambientPhase(position)`, which hashes the object's world position into [0, 1). The engine swaps each animated sprite's texture in the ticker. Speakers are not animated yet (ticket 05).
- **Needs a human:** review the generated frames in the running game, retouch them by hand or tune the script, and tune the timings in Tiled. Re-running the script overwrites retouched frames.
