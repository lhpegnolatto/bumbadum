# 02 — Compact layout skeleton

**What to build:** Below 1024 px wide or 640 px tall, the room shows the compact portrait layout instead of the compatibility notice. The world fills the viewport, the Screen sits full width at the top below the safe area, and a thin Radio strip with Now playing sits beneath it. The camera frames the local player below the Screen. This ticket keeps today's room controls usable in the compact layout. Tickets 03, 04 and 05 replace them with the stick, the sheet and the pink buttons. Accept ADR-0018 and add `minimum viewport superseded by ADR-0018` to ADR-0014's status.

**Blocked by:** 01

**Status:** resolved

- [x] One component tree. Crossing the 1024×640 boundary in either direction never remounts the Screen's iframe, the canvas or the connection. An e2e test resizes across it and asserts no new join and no iframe reload.
- [x] The engine accepts a top inset (the Screen and Radio strip height, 0 on desktop) and centres the local player in the visible area beneath it. Pure camera tests cover the inset, including clamping at the Map's top edge.
- [x] The Screen is 16:9, full width and unobstructed, starts below `env(safe-area-inset-top)`, and is at least 200 px tall at 360 px wide.
- [x] The viewport meta has `viewport-fit=cover` and `interactive-widget=resizes-content`.
- [x] A compact viewport in landscape with height < 500 px shows a "rotate your device" notice. A viewport narrower than 360 px shows the compatibility notice. Both keep the connection (en and pt-BR).
- [x] While any notice covers the room, including the existing desktop one, the Screen is paused. When it is uncovered, playback resumes in sync with the radio.
- [x] Playwright gains Pixel 7 and iPhone 14 projects (`hasTouch`, `isMobile`) reusing the lobby entry fixture. They cover joining, canvas coverage, Screen geometry, the avatar drawn below the Screen (`drawnPlayers`) and the rotate notice.
- [x] ADR-0018 is `accepted` and ADR-0014's status points to it.
- [x] `pnpm check` and `pnpm test:e2e` are green.
