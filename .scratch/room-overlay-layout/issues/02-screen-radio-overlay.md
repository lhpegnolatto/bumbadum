# 02 — Screen and Radio overlay the world

**What to build:** Place the always-visible Screen and compact Radio controls over the upper-right area of the full-viewport world without resizing the canvas, while keeping the room's existing information accessible during the layout migration.

**Blocked by:** 01 — Full-viewport world with crisp pixel art.

**Status:** resolved

- [x] The Screen and Radio bar overlay rather than reduce the canvas bounds.
- [x] The overlay width follows the agreed 400 px minimum, 32 vw preferred and 480 px maximum rule.
- [x] The Screen stays 16:9, at least 400×225 px and unobstructed.
- [x] The Radio bar shows Now playing, Submitter and volume; theme is no longer part of the Radio controls.
- [x] Opening or changing existing room information does not alter the world bounds, scale or position.
