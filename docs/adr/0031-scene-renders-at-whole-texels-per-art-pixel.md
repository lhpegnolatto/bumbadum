---
status: accepted
---

# The scene renders at whole texels per art pixel

The Ambient light is a filter over the whole scene (the PixiJS container of the Map, avatars, cars and confetti), so the GPU paints it twice a frame: once into the Ambient light's texture, once onto the canvas. At the screen's own resolution that is several physical pixels for every art pixel (6×6 on a phone at a ratio of 2.625, 2×2 on a desktop at 1), and weak GPUs fell to 30–40 fps on fill alone; the script took 3 % of each frame. The scene now renders at fewer texels: each art pixel splits into the fewest whole texels, at least two, and an art pixel of 2 physical pixels, the smallest, is one texel. That gives texels of 3 physical pixels on that phone, 2 on that desktop and 2 at a ratio of 2, while an art pixel with no such split, such as 3 physical pixels at ratios of 1.25 or 1.5, keeps the screen's resolution. The Ambient light's texture is scaled up by that whole number with nearest sampling, so the art stays as sharp as ADR-0017 drew it, and the world's position is rounded to whole scene texels instead of whole physical pixels, so art pixels stay aligned with texels. This supersedes ADR-0017's position rounding; its scale rule still holds.

The cost is coarser motion: the camera and gliding avatars move a scene texel at a time instead of one physical pixel, half an art pixel at most, except on the desktop at a ratio of 1, where it is a whole art pixel of 2 physical pixels. Only those two screens were measured to stall, so the rule saves the least fill elsewhere rather than coarsen motion where no bottleneck was seen. Nicknames, speech bubbles and the Lamp glow lie outside the filter and keep the screen's resolution.

## Considered options

- Rendering the scene at one texel per art pixel everywhere: the least fill, but motion steps a whole art pixel on every screen.
- Texels of at least 3 physical pixels on every screen: more fill saved, but a whole art pixel per step at ratios of 1.25 and 2, where no bottleneck was measured.
- Capping the canvas resolution below the device pixel ratio: the browser smooths the upscaled canvas, the blur ADR-0017 rejected.
- Culling off-screen objects, or fewer draw calls: measured, no gain; the cost is fill, not geometry.
