# 04 — Objects and players share depth order

**What to build:** Extend the generator to pack the individual object images into an atlas and to emit a game-engine module with each object's frame, position and depth key (the sprite's bottom edge, the Tiled object's `y`). The engine draws objects in the same depth-sorted container as players, so avatars pass behind tree canopies, lamp posts and buildings and in front of things above them.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] The atlas and placement module are generated, committed and covered by `--check`.
- [ ] A pure depth comparison is tested: an object below a player draws in front, an object above draws behind, and on a tie the player is in front.
- [ ] A player standing on a chair tile is drawn over the chair.
- [ ] `pnpm check` and `pnpm test:e2e` are green.
