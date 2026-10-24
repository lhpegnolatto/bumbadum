# 07 — Desktop viewport compatibility without reconnection

**What to build:** Replace an unusably compressed room with a compatibility notice below the supported desktop size, then restore the live room when enough space returns.

**Blocked by:** 04 — Collapsible Chat with contextual input and unread indicator; 05 — Persistent room Settings; 06 — Wardrobe integrated with room overlays.

**Status:** resolved

- [x] Viewports smaller than 1024×640 show the desktop compatibility notice instead of overlapping room controls.
- [x] Showing the notice does not leave the Room, discard in-memory room state or require another join.
- [x] Restoring both supported dimensions reveals the room at its current state without reconnecting.
- [x] Exactly 1024×640 remains supported.
- [x] Integrated browser coverage verifies stable canvas geometry, unobstructed Screen, accessible controls and reduced-motion behavior across the completed layout.
