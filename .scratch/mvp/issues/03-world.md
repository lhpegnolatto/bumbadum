# World

Status: ready-for-agent
Type: task
Blocked by: 01, 02

## What

The lobby map (about 20×15 tiles, plain shapes, fits the viewport, no camera movement), a spawn point, and step movement with `WASD`/arrows using the values from the movement prototype. The client predicts its steps; the server validates them against blocked tiles and corrects the client.

See [spec](../spec.md): World, Layout and keyboard.

## Acceptance criteria

- [ ] `packages/world` covers map, blocked tiles, steps and direction, test-first.
- [ ] A step intent carries only a direction; the server applies it from the position it holds and refuses steps into blocked tiles. The client replays its unacknowledged steps from the corrected position and slides there over 120 ms.
- [ ] Step rate 6 steps/s, 200 ms repeat delay, glide between tiles, 5 px bump on a blocked tile (values from ticket 02).
- [ ] Holding a key keeps walking; pressing towards a blocked tile only turns.
- [ ] Players overlap freely.
- [ ] E2E: one player walks, the other sees it.

## Notes

Tiles are 16 px: the character sprites fill about one tile inside their 32×32 frame (see `.scratch/mvp/research/tileset.md`). Render scaled by a whole number with nearest-neighbour filtering. The prototype on branch `worktree-agent-a7aa6f69023ccc7d4` (`prototypes/movement/src/movement.ts`) holds DOM-free movement logic worth reusing.
