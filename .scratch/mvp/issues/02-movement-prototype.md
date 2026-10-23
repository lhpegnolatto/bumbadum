# Movement prototype

Status: resolved
Type: prototype

## What

A throwaway prototype to settle how step movement feels before ticket 03 builds it: steps per second while a key is held, the delay before repeating, turning towards a blocked tile, and how a server correction looks (snap vs. short slide) under simulated latency of 50–300 ms.

## Acceptance criteria

- [x] The human tries it and picks the step rate, repeat delay and correction style.
- [x] The chosen values are recorded under `## Answer`; the prototype code is not merged.

## Answer

Prototype on branch `worktree-agent-a7aa6f69023ccc7d4`, under `prototypes/movement/` (not merged). Its DOM-free movement logic in `src/movement.ts` is a starting point for `packages/world`. Chosen by the human:

| Setting | Value |
|---|---|
| Step rate | 6 steps/s (167 ms per step) while a key is held |
| Repeat delay | 200 ms between the first and second step |
| Turn first | off: every press steps, unless the target tile is blocked |
| Blocked tile | the player only turns, with a 5 px bump |
| Rendering | glide between tiles over one step's duration |
| Correction | slide over 120 ms |
| Server judges | **direction only**: each step intent carries a direction, the server applies it from the position it holds; after a refusal the client replays its unacknowledged steps from the corrected position |
