# 01 — Ambient light follows the Time of day

**What to build:** A pure `daylight` module in `packages/game-engine/src/daylight/` holds the Day period table from the spec and interpolates it into Ambient light parameters and a Lamp glow level for any Time of day. The engine wraps the floor, objects, Players, Cars, the Tennis layer and confetti in a scene container with a `ColorMatrixFilter` driven by it, while labels and speech bubbles stay outside. The engine receives the Time of day through an option; `apps/web` feeds it from the device clock, or from `?time=HH:MM` outside production. The existing `lights.png` layer keeps its current behaviour, faded by the Lamp glow level, until 02 replaces it. Colour values are calibrated in a prototype and approved by a human.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `daylight` returns the table's values exactly at each keyframe, interpolates linearly between neighbours, wraps from 20:30 to 00:00, and treats minutes as a fraction of the hour. Unit-tested.
- [ ] `parcial` is 15% and `acendendo` is 60% Lamp glow.
- [ ] The filter applies to the scene only; nicknames, speech bubbles and the room UI are unaffected.
- [ ] `?time=HH:MM` fixes the Time of day in development and is ignored in production builds.
- [ ] A prototype shows each Day period with a Tennis match and a Car in view; a human approves the calibration, including that Avatars, Cars and the Ball stay clearly visible at the darkest hour.
- [ ] `pnpm check` is green.
