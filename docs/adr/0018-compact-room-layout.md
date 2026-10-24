---
status: accepted
---

# A compact portrait layout for small viewports

Viewports narrower than 1024 px or shorter than 640 px get a compact, portrait-only layout instead of ADR-0014's compatibility notice. The world still fills the viewport. The Screen sits full width at the top, at 16:9 and at least 200 px tall, which is YouTube's minimum (ADR-0006), so the narrowest supported width is 360 px. Chat, Queue and Players share one sheet below it. Landscape phones and narrower viewports see a notice that keeps the connection and pauses the Screen while it covers it. Both layouts are one component tree that differs only in CSS, because remounting the Screen's iframe on rotation or resize would restart playback and could hit the browser's autoplay block. Touch movement follows the pointer type (`pointer: coarse`), not the layout, so a touch tablet in the desktop layout can still walk. This supersedes ADR-0014's 1024×640 minimum; its overlay rules still hold.

## Considered options

- A landscape phone layout with the Screen beside the world: the Screen would take most of the 390 px height and leave the world a strip.
- Separate mobile and desktop component trees: simpler CSS, but switching between them remounts the Screen.
