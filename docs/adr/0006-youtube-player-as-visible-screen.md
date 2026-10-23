---
status: accepted
---

# The YouTube player is a visible screen in the room

YouTube's Required Minimum Functionality forbids hiding the embedded player, requires a viewport of at least 200×200 px, and forbids drawing anything in front of it; audio-only playback is not allowed. The embed is therefore the room's screen: an iframe positioned over the PixiJS canvas, always visible and at least 200×200 px. It can be shrunk to a corner but never hidden, and nothing (chat bubbles, avatars, menus) renders on top of it.

## Consequences

- Autoplay only starts once more than half of the embed is visible, so the screen must be on-screen when a player joins.
