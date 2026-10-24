# 04 — Objects and players share depth order

**What to build:** Extend the generator to pack the individual object images into an atlas and to emit a game-engine module with each object's frame, position and depth key (the sprite's bottom edge, the Tiled object's `y`). The engine draws objects in the same depth-sorted container as players, so avatars pass behind tree canopies, lamp posts and buildings and in front of things above them.

**Blocked by:** 03

**Status:** resolved

- [x] The atlas and placement module are generated, committed and covered by `--check`.
- [x] A pure depth comparison is tested: an object below a player draws in front, an object above draws behind, and on a tie the player is in front.
- [x] A player on a chair's tile is seated behind its backrest.
- [x] `pnpm check` and `pnpm test:e2e` are green.

**Note:** The chairs were authored off the tile grid, so rows behaved differently: on rows 1 and 4 the backrest hid the player (seated), on rows 2 and 3 the player drew over the chair. The user chose "seated" for all: chair bases moved to 2 px below the bottom edge of the tile each chair mostly covers (198→210, 234→242, 270→274, 306 unchanged).
