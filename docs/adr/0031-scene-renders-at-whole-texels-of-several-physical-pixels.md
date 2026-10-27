---
status: accepted
---

# The scene renders at whole texels of several physical pixels

The Ambient light is a filter over the whole scene (the PixiJS container of the Map, avatars, cars and confetti), so the GPU paints it twice a frame: once into the Ambient light's texture, once onto the canvas. At the screen's own resolution that is several physical pixels for every art pixel (6×6 on a phone at a ratio of 2.625, 2×2 on a desktop at 1), and weak GPUs fell to 30–40 fps on fill alone; the script took 3 % of each frame. The scene now renders at fewer texels per art pixel, as a whole texel of physical pixels a side: the smallest divisor of the art pixel that is at least 3, or the whole art pixel when it has none (3 on that phone, 2 on that desktop, 4 at a ratio of 2). The Ambient light's texture is scaled up by that whole number with nearest sampling, so the art stays as sharp as ADR-0017 drew it, and the world's position is rounded to whole scene texels instead of whole physical pixels, so art pixels stay aligned with texels. This supersedes ADR-0017's position rounding; its scale rule still holds.

The cost is coarser motion: the camera and gliding avatars move a scene texel at a time, half an art pixel on that phone and a whole one on that desktop and at ratios of 1.25 or 2, instead of one physical pixel. Nicknames, speech bubbles and the Lamp glow lie outside the filter and keep the screen's resolution.

## Considered options

- Rendering the scene at one texel per art pixel everywhere: the least fill, but motion steps a whole art pixel on every screen.
- Capping the canvas resolution below the device pixel ratio: the browser smooths the upscaled canvas, the blur ADR-0017 rejected.
- Culling off-screen objects, or fewer draw calls: measured, no gain; the cost is fill, not geometry.
