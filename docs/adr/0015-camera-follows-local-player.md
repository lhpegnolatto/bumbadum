---
status: scale rule superseded by ADR-0017
---

# The camera follows the local player

The Lobby's Map is 60×40 tiles (960×640 px), so keeping it fully visible at a whole-number scale, as ADR-0014 required, renders it at 1× on every viewport smaller than 1920×1280 and leaves 24 px avatars. The world is instead drawn at the smallest whole-number scale of at least 2× at which the Map covers the whole viewport, and the camera centres on the local player's drawn position, clamped to the Map's edges and rounded to whole screen pixels. This supersedes ADR-0014's map framing; its overlay layout still holds.

## Considered options

- Whole Map at 1×: crisp, but avatars too small to read on common laptop and 1080p screens.
- Whole Map at a fractional scale: pixel art blurs or shimmers.
