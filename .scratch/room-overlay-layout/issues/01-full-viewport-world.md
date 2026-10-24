# 01 — Full-viewport world with crisp pixel art

**What to build:** Make the world fill the browser viewport while the complete Map remains centred at the largest whole-number scale that fits, surrounded by a world-appropriate background rather than interface padding or black letterboxing.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] The canvas container covers the full supported viewport and does not reserve space for room interface.
- [x] The complete Map is centred horizontally and vertically at a whole-number scale for representative 4:3, widescreen, tall and minimum supported viewports.
- [x] Nearest-neighbour rendering, disabled antialiasing and rounded rendered pixels remain in effect.
- [x] Pure tests prove the fitting scale and centred offsets without inspecting rendered pixels.
- [x] Existing walking, state application and speech bubbles continue to work.
