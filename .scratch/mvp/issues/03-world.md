# World

Status: ready-for-agent
Type: task
Blocked by: 01, 02

## What

The lobby map (about 20×15 tiles, plain shapes, fits the viewport, no camera movement), a spawn point, and step movement with `WASD`/arrows using the values from the movement prototype. The client predicts its steps; the server validates them against blocked tiles and corrects the client.

See [spec](../spec.md): World, Layout and keyboard.

## Acceptance criteria

- [ ] `packages/world` covers map, blocked tiles, steps and direction, test-first.
- [ ] The server rejects a step into a blocked tile or more than one tile away, and the client snaps back.
- [ ] Holding a key keeps walking; pressing towards a blocked tile only turns.
- [ ] Players overlap freely.
- [ ] E2E: one player walks, the other sees it.
