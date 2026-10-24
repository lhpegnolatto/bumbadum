# 03 — Exclusive navigation between Chat, Queue and Players

**What to build:** Let the Player opt into Chat, Queue or Players through an accessible lower-right control group, with a single active panel occupying the space beneath the Screen.

**Blocked by:** 02 — Screen and Radio overlay the world.

**Status:** resolved

- [x] No room panel is open when the Player enters or reloads the room.
- [x] Accessible Chat, Queue and Players controls open their corresponding panels below the Screen.
- [x] Opening one panel closes the previous panel.
- [x] The active control, the panel close control and Escape close the active panel.
- [x] Clicking or walking in the world does not close an open panel, and panel changes do not alter canvas geometry.
- [x] Panel transitions respect the Player's reduced-motion preference.
