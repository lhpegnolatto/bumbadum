---
status: accepted
---

# The screen lives in a side column, beside the room

The room's map fits the viewport and the camera does not move, so the YouTube screen sits in a column beside the PixiJS canvas, together with the queue and the chat, instead of floating over the canvas. The screen is 16:9 and never smaller than 400×225 px, so it always meets YouTube's Required Minimum Functionality (visible, at least 200×200 px, nothing drawn on top) without tracking the canvas scale or keeping avatars from walking in front of it. This supersedes ADR-0006's placement; its constraints still apply.

## Considered options

- A TV on a wall of the map, with the iframe over that area of the canvas: cosier, but it must follow the canvas scale, stay above 200×200 px in small windows and hide avatars passing in front. Worth revisiting once the map has real art.
