# 04 — Ambient animations for trees, shrubs, flags and bunting

**What to build:** Trees (`tree-*`, `pine`), shrubs (`shrub`, `shrub-flower`), flags (`flag-*`) and bunting (`bunting`, `bunting-short`) loop through authored frames. A script generates the extra frames from the current images, and a human reviews them. The frames are declared as tile animations in `objects.tsj`. The generator packs every frame into the atlas and exports each object's frame list and durations. The engine advances each object with a phase derived from its position, so neighbours never move in unison.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Starting timings: trees and shrubs 4 frames over ~2.4 s, flags and bunting 3 frames over ~0.5 s; tuned with a human in the prototype.
- [ ] The generator exports animation frames and durations, and fails on a frame from another tileset.
- [ ] A pure timeline returns the frame for a time and a phase, derives the phase from position, and holds the first frame under reduced motion. Unit-tested.
- [ ] Depth order is unchanged: every frame keeps its object's base.
- [ ] `pnpm check` is green.
