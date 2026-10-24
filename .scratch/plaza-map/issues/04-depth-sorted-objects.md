# 04 — Objects and players share depth order

**What to build:** Extend the generator to pack the individual object images into an atlas and to emit a game-engine module with each object's frame, position and depth key (the sprite's bottom edge, the Tiled object's `y`). The engine draws objects in the same depth-sorted container as players, so avatars pass behind tree canopies, lamp posts and buildings and in front of things above them.

**Blocked by:** 03

**Status:** resolved

- [x] The atlas and placement module are generated, committed and covered by `--check`.
- [x] A pure depth comparison is tested: an object below a player draws in front, an object above draws behind, and on a tie the player is in front.
- [x] A player standing on a chair tile is drawn over the chair.
- [x] `pnpm check` and `pnpm test:e2e` are green.

**Note:** "Chair tile" is tested as the tile under the chair's legs (its bottom pixel row). The chairs are placed off the tile grid, so for the 12 chairs whose sprite mostly covers the tile above their legs (bases at y 198 and y 306, rows 11 and 18), a player on that upper tile is drawn behind the chair, and on the leg tile they stand mostly below it. Snapping each chair's `y` to a tile's bottom edge in Tiled would make the leg tile the one the chair covers.
