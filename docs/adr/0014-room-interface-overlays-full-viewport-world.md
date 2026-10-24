---
status: map framing superseded by ADR-0015
---

# The room interface overlays a full-viewport world

The room's PixiJS canvas fills the browser viewport while the Screen, chat controls and room panels overlay it, so opening a panel never resizes or rescales the world. The temporary 4:3 map remains fully visible, centred at an integer scale for crisp pixel art, with the canvas filling any surrounding area; the Screen stays visible at 16:9 and at least 400×225 px. This supersedes ADR-0010's fixed side column.

## Consequences

- Only one room panel is open at a time; the Screen, message input and buttons remain visible. The Wardrobe may use a wider overlay beside the Screen, while Chat, Queue and Players share the narrower region below it.
- Chat history opens below the Screen without changing the world's framing. While it is closed, new messages set an unread indicator and existing avatar speech bubbles remain the transient preview.
- The MVP layout requires a viewport of at least 1024×640. Smaller viewports show the desktop compatibility notice without disconnecting; mobile layout and touch controls are separate future work.
