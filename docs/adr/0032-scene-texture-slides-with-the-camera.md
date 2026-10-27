---
status: accepted
---

# The scene's texture slides with the camera

ADR-0031 renders the scene at whole texels per art pixel, and rounded the world's position to whole texels so its art stayed on them. That made the camera scroll a texel at a time. On a desktop at a ratio of 1 a texel is a whole art pixel, so the world moved in uneven steps of 2 and 4 physical pixels while the player walked, where it had moved in steps of 3 and 4. The walking player looked to flicker and smear. Other players walking past looked normal, because the camera only moves with the local player.

The world's position is rounded to whole physical pixels again, as ADR-0017 decided. The scene now renders into its own texture, which covers the screen and one texel more. The texture starts on the world's texel grid, at or just before the viewport's corner. Inside it the world sits on whole texels, so the art stays sharp. On screen the texture slides with the camera by whole physical pixels, so the scroll stays smooth. This supersedes ADR-0031's position rounding; its texel sizes still hold.

The texture is drawn to the screen as a single unbatched mesh. As a sprite, it went through PixiJS's batch shader, which chooses among many textures for every pixel. Across the whole screen that cost a weak GPU as much as the scene itself: 35 fps instead of 60 on a phone profile.

Avatars, Cars and confetti still move across the world a texel at a time, which is the cost ADR-0031 accepted.

## Considered options

- Keeping the camera on whole texels: no extra texture, but the scroll stutters wherever a texel spans more than one physical pixel.
- Rendering the scene at the screen's resolution on a desktop at a ratio of 1: a smooth scroll, but that desktop stalled at 43 fps on a weak GPU.
