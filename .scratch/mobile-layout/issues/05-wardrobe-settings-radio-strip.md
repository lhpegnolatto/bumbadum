# 05 — Wardrobe and Settings buttons, mute on touch

**What to build:** In the compact layout, put two icon-only buttons stacked at the bottom left. Wardrobe opens the Wardrobe as a sheet below the Radio strip. Settings opens the language and theme controls. On coarse pointers, the Radio strip offers a mute toggle in place of the volume slider.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Before building the mute toggle, check the YouTube IFrame API docs for whether `setVolume` has any effect on iOS. Record the answer under `## Comments`. If it works, keep the slider and drop the toggle.
- [ ] The Wardrobe sheet reuses the sheet from 04. Its draft and discard behaviour is unchanged, and the player does not walk while it is open.
- [ ] The Settings popover fits within 360 px and respects the safe areas.
- [ ] The mute toggle persists through the existing validated local settings and is announced to screen readers.
- [ ] Icon-only buttons have accessible names in en and pt-BR, and stay clear of `env(safe-area-inset-bottom)`.
- [ ] Mobile e2e tests cover opening, editing, wearing and closing in the Wardrobe sheet, switching theme and language from Settings, and muting.
- [ ] `pnpm check` and `pnpm test:e2e` are green.
