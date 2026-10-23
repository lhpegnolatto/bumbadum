# World

Status: resolved
Type: task
Blocked by: 01, 02

## What

The lobby map (about 20×15 tiles, plain shapes, fits the viewport, no camera movement), a spawn point, and step movement with `WASD`/arrows using the values from the movement prototype. The client predicts its steps; the server validates them against blocked tiles and corrects the client.

See [spec](../spec.md): World, Layout and keyboard.

## Acceptance criteria

- [x] `packages/world` covers map, blocked tiles, steps and direction, test-first.
- [x] A step intent carries only a direction; the server applies it from the position it holds and refuses steps into blocked tiles. The client replays its unacknowledged steps from the corrected position and slides there over 120 ms.
- [x] Step rate 6 steps/s, 200 ms repeat delay, glide between tiles, 5 px bump on a blocked tile (values from ticket 02).
- [x] Holding a key keeps walking; pressing towards a blocked tile only turns.
- [x] Players overlap freely.
- [x] E2E: one player walks, the other sees it.

## Notes

Tiles are 16 px: a MetroCity character's body is about 14×28 px inside its 32×32 frame, so it stands one tile wide and about two tall, with its feet on its tile. Render scaled by a whole number with nearest-neighbour filtering. The prototype on branch `prototype/movement` (`prototypes/movement/src/movement.ts`) holds DOM-free movement logic worth reusing.

## Comments

Built as specified.

- `packages/world`: `createMap` (rows of `#`, `.`, `S`), `isWalkable`, `step` (one tile, or stay and only turn towards a blocked tile), `Direction`, `STEPS_PER_SECOND` and the hand-made `lobbyMap` (20×15, spawn point at 10,7).
- Message `step` (`STEP_MESSAGE`) whose payload is just a direction, parsed by `parseStepIntent`. `PlayerState` gained `direction` and `stepIntents`, the count of step intents the room has handled (applied or refused). The client reconciles against that count instead of sending sequence numbers.
- The server allows a burst of one second's worth of steps (6), refilling at 6 per second per player. Steps over that limit are refused but still counted.
- `game-engine` predicts steps (`StepPredictor`), turns held keys into steps (`StepRepeater`) and glides avatars (`Glide`, `bumpOffset`). The bump is 5/32 of a tile, the prototype's 5 px on its 32 px tiles. The map renders at 16 px tiles, scaled by the largest whole number that fits the canvas column.
- Reconnecting with the seat kept leaves the player where they were. Sending them back to the spawn point belongs to ticket 10.
