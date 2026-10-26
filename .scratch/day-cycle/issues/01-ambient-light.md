# 01 — Ambient light follows the Time of day

**What to build:** A pure `daylight` module in `packages/game-engine/src/daylight/` holds the Day period table from the spec and interpolates it into Ambient light parameters and a Lamp glow level for any Time of day. The engine wraps the floor, objects, Players, Cars, the Tennis layer and confetti in a scene container with a `ColorMatrixFilter` driven by it, while labels and speech bubbles stay outside. The engine receives the Time of day through an option; `apps/web` feeds it from the device clock, or from `?time=HH:MM` outside production. The existing `lights.png` layer keeps its current behaviour, faded by the Lamp glow level, until 02 replaces it. Colour values are calibrated in a prototype and approved by a human.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] `daylight` returns the table's values exactly at each keyframe, interpolates linearly between neighbours, wraps from 20:30 to 00:00, and treats minutes as a fraction of the hour. Unit-tested.
- [x] `parcial` is 15% and `acendendo` is 60% Lamp glow.
- [x] The filter applies to the scene only; nicknames, speech bubbles and the room UI are unaffected.
- [x] `?time=HH:MM` fixes the Time of day in development and is ignored in production builds.
- [ ] A prototype shows each Day period with a Tennis match and a Car in view; a human approves the calibration, including that Avatars, Cars and the Ball stay clearly visible at the darkest hour.
- [ ] `pnpm check` is green.

## Answer

Commit `f59b3c8` (`feat(game-engine): ambient light follows the time of day`).

- `packages/game-engine/src/daylight/daylight.ts`: the Day period table and `daylightAt(timeOfDay)` → `{ ambientLight: { saturation, multiply, overlay, overlayStrength }, lampGlow }`, linear between neighbours, with the first Night repeated at 24:00 so 20:30 → 00:00 wraps. `ambientLightMatrix` builds the `ColorMatrixFilter` matrix (saturate around Rec. 709 luminance, multiply each channel, mix in the overlay; alpha untouched). `isNeutralAmbientLight` lets the engine switch the filter off from Morning to Midday.
- The engine: a `scene` container (floor, depth-sorted objects, Players, Cars, Tennis layer, confetti) carries the filter at `resolution: "inherit"` so pixel art stays sharp; `lights.png` sits above the scene, outside the filter, with `alpha` = Lamp glow. The ticker sets the filter every frame from the `timeOfDay()` option (hours since midnight, 18.5 = 18:30).
- `apps/web/src/features/room/time-of-day.ts`: `deviceTimeOfDay(date)` and `timeOfDayOverride(search, production)`; `game-canvas.tsx` passes `?time=HH:MM` when it is valid and the build is not production, the device clock otherwise.
- Tests: `daylight.test.ts` (Lamp glow at every keyframe, a midpoint for every parameter, the wrap, minute fractions, 15% and 60%, neutral Morning–Midday, a legibility guard at Night: white keeps ≥ 55% luminance and mid-grey ≥ 0.25 per channel, cool Night and warm Dawn/Sunset/Dusk) and `time-of-day.test.ts`.

Proposed colours, awaiting calibration (preview with `/r/<slug>?time=HH:MM`):

| Time | Day period | Saturation | Multiply (R, G, B) | Overlay | Strength | Lamp glow |
|---|---|---|---|---|---|---|
| 00:00, 04:30, 20:30 | Night / Late night | 0.70 | 0.62, 0.68, 0.86 | `#1c2550` navy | 0.10 | 100% |
| 06:00 | Dawn | 0.85 | 0.94, 0.84, 0.86 | `#ffa08c` pink-orange | 0.12 | 45% |
| 08:00, 12:30 | Morning / Midday | 1 | 1, 1, 1 | none | 0 | 0% |
| 15:30 | Afternoon | 1.05 | 1, 0.98, 0.94 | `#ffd9a0` pale gold | 0.05 | 0% |
| 17:48 | Sunset | 1.10 | 1, 0.86, 0.72 | `#ff9a3c` golden orange | 0.16 | 15% |
| 19:00 | Dusk | 0.90 | 0.84, 0.72, 0.70 | `#d9784a` warm amber | 0.14 | 60% |

Night leaves white at about 63% luminance.

Still open: the calibration box needs a human to look at every Day period with a Tennis match and a Car in view (no separate prototype was built; `?time=` is the preview). `pnpm check` is green except three `apps/server` `lobby-room` Tennis tests that already fail at `f0e0a9e`, before this change (the server depends on neither `game-engine` nor `web`).

## Comments

The v7 bundle's calibrated lighting table replaces the proposed colours above; see 07.
