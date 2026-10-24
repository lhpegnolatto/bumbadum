# 02 — The camera follows the local player

**What to build:** Replace `fitMapToViewport` with a camera that draws the world at the smallest whole-number scale of at least 2× that covers the viewport. It centres on the local player's drawn position, is clamped to the Map's edges and is rounded to whole screen pixels (ADR-0015).

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] A pure camera seam, unit-tested for scale on 1024×640, 1920×1080, 2560×1440 and 3840×2160, centring, edge and corner clamping, and whole-pixel offsets.
- [ ] The camera tracks the glide, not the server tile, so it moves smoothly with the avatar.
- [ ] Nicknames and speech bubbles stay attached to their avatars as the camera moves.
- [ ] Opening or closing panels still never changes the world's scale or framing.
- [ ] `pnpm check` and `pnpm test:e2e` are green.
