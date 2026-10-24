# 01 — The world scales by whole physical pixels

**What to build:** Make the camera choose a whole number of physical pixels per art pixel: the smallest that is at least `ceil(2 × devicePixelRatio)` and covers the viewport. The world's position is rounded to whole physical pixels. Accept ADR-0017 and set ADR-0015's status to `scale rule superseded by ADR-0017`. Desktop users on fractional ratios such as 125 % get sharp pixels with this ticket alone.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] The pure camera seam takes the device pixel ratio and is unit-tested at ratios 1, 1.25, 2, 2.625 and 3: a whole number of physical pixels per art pixel, coverage of the viewport, and offsets rounded to physical pixels.
- [ ] Existing following and edge-clamping tests still pass.
- [ ] The engine reads the ratio it renders at, and reacts when it changes (browser zoom, moving the window to another monitor).
- [ ] Nicknames and speech bubbles stay attached to their avatars at fractional CSS scales.
- [ ] ADR-0017 is `accepted`, and ADR-0015's status points to it.
- [ ] `pnpm check` and `pnpm test:e2e` are green.
