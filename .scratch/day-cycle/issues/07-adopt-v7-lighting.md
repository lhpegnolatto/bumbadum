# 07 — Adopt the v7 lighting table and animation phase

**What to build:** Replace the proposed colours in `daylight` with the v7 bundle's `iluminacao/iluminacao.json` keyframes, build the Ambient light matrix with the bundle's recipe (saturation; diagonal `multiplicar × (1 − alfa)`; offset `cor / 255 × alfa`), and add the lit-windows level (`janelas_acesas`) to `daylightAt`. Replace the Ambient animation phase with the bundle's starting-frame formula `(x × 7 + y × 13) mod frames`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `daylight` returns the bundle's values exactly at each keyframe (Lamp glow 55% at Sunset, 85% at Dusk), interpolates linearly, wraps 20:30 → 00:00, and returns the lit-windows level. Unit-tested.
- [ ] The matrix follows the bundle's recipe; the night still passes a legibility check for Avatars, Cars and the Ball.
- [ ] The Ambient animation starting frame follows the bundle's formula. Unit-tested.
- [ ] `pnpm check` is green (apart from the three known Tennis failures).
