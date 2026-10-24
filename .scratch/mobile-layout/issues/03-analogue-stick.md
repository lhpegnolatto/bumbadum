# 03 — Analogue stick for touch movement

**What to build:** On coarse pointers, show a fixed analogue stick. It sits at the bottom centre in the compact layout and above the bottom-left buttons in the desktop layout. It walks the local player in four directions through a new engine method, `steer(direction | null)`, which drives the same `StepRepeater` as the keyboard.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] A pure function maps the thumb's offset to a direction or `null`: a dead zone, the dominant axis, and hysteresis near the diagonals. It is unit-tested.
- [ ] `steer` presses the new direction and releases the previous one, and `null` releases everything. Tapping past the dead zone takes one Step, holding repeats with the keyboard's timing, and sliding changes direction without lifting.
- [ ] `pointerup`, `pointercancel` and lost pointer capture stop walking.
- [ ] The stick and its area use `touch-action: none` and `user-select: none`, and suppress the long-press menu. Using it never zooms, scrolls or selects text.
- [ ] The stick is hidden on fine pointers. It is hidden and inert while a sheet or the Wardrobe is open.
- [ ] It has an accessible name (en and pt-BR), and keyboard movement still works alongside it.
- [ ] A mobile e2e test walks the local player with pointer events on the stick and asserts the new tile through `drawnPlayers`.
- [ ] `pnpm check` and `pnpm test:e2e` are green.
