# 05 — Speakers pulse while a Track is on air

**What to build:** `speaker` and `speaker-low` get a 2-frame pulse (~0.25 s) declared like any Ambient animation. The engine gains `setOnAir(onAir: boolean)`, and the speakers animate only while it is on. `apps/web` calls it from the Radio's Now playing.

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] The v7 bundle has no speaker animation, so the 2 frames are drawn by a script from `speaker.png` and `speaker-low.png` and reviewed by a human.
- [ ] Speakers pulse while a Track is on air and hold their first frame when the Radio is silent or under reduced motion.
- [ ] `setOnAir` follows Now playing when a Track starts, is skipped, or the queue empties.
- [ ] `pnpm check` is green.
