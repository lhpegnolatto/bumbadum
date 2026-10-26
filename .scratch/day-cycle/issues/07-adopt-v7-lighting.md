# 07 — Adopt the v7 lighting table and animation phase

**What to build:** Replace the proposed colours in `daylight` with the v7 bundle's `iluminacao/iluminacao.json` keyframes, build the Ambient light matrix with the bundle's recipe (saturation; diagonal `multiplicar × (1 − alfa)`; offset `cor / 255 × alfa`), and add the lit-windows level (`janelas_acesas`) to `daylightAt`. Replace the Ambient animation phase with the bundle's starting-frame formula `(x × 7 + y × 13) mod frames`.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] `daylight` returns the bundle's values exactly at each keyframe (Lamp glow 55% at Sunset, 85% at Dusk), interpolates linearly, wraps 20:30 → 00:00, and returns the lit-windows level. Unit-tested.
- [x] The matrix follows the bundle's recipe; the night still passes a legibility check for Avatars, Cars and the Ball.
- [x] The Ambient animation starting frame follows the bundle's formula. Unit-tested.
- [x] `pnpm check` is green (apart from the three known Tennis failures).

## Answer

- `packages/game-engine/src/daylight/daylight.ts` holds the nine keyframes of `assets/mapa_praca_v7/iluminacao/iluminacao.json` verbatim (Sunset at 17.8 h, the bundle's value for 17:48; overlay colours kept in 0–255 and divided by 255 on the way out). `daylightAt(timeOfDay)` → `{ ambientLight: { saturation, multiply, overlay, overlayStrength }, lampGlow, litWindows }`, every value linear between neighbours, with the first Night repeated at 24:00 so 20:30 → 00:00 wraps. `litWindows` is `janelas_acesas` interpolated (0.5 at 07:00 and at 16:39), for ticket 03 to consume.
- `ambientLightMatrix` follows the bundle's recipe: saturate, multiply each channel by `multiplicar × (1 − alfa)`, add `cor / 255 × alfa` in the offset column (PixiJS 8's `ColorMatrixFilter` shader adds column 5 as is, in 0–1 units, on unpremultiplied colour). Saturation now moves away from Rec. 601 luma instead of Rec. 709, because that is what the bundle's previews were rendered with.
- `isNeutralAmbientLight` is gone: no v7 keyframe leaves the Map untouched (Morning tints, Midday brightens by 4%), so the filter is always on.
- Preview check (Node + sharp): applying the recipe to `camada_1_chao.png` + `camada_2_objetos_dia.png` (or `_noite.png` where `janelas_acesas` = 1) and comparing with `iluminacao/mapa_<period>.png` on the 1.73 M pixels the light layers leave untouched: every Day period matches within 1/255 per channel (mean error 0.4–0.6/255) with Rec. 601 luma, within 2/255 with Rec. 709. `mapa_praca_960x640.png` is not the previews' base: it is darker than the floor and object layers by 5–20/255, so comparing against it alone looks off by ~7/255 even at Midday.
- Legibility at Night (darker than the first pass): white keeps ≥ 40% luminance (the bundle leaves ~41%), mid-grey ≥ 0.18 in every channel, a saturated red ≥ 0.10 luminance.
- `packages/game-engine/src/sprites/ambient-animation.ts`: `ambientStartFrame({ x, y }, frames)` = `(x × 7 + y × 13) mod frames`, fed the Tiled object's position (the placement's `x` and `base`, Tiled's `y` for tile objects); `ambientFrame(durations, now, startFrame, reducedMotion)` starts the loop at the beginning of that frame. The hash-based `ambientPhase` is removed.
- `pnpm check`: Biome and typecheck clean; every test passes except the three known `lobby-room` Tennis tests.
