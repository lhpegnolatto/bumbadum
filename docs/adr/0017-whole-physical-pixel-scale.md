---
status: proposed
---

# The world scales by whole physical pixels

ADR-0015 draws the world at a whole-number scale in CSS pixels, but the canvas renders at the device pixel ratio. On fractional ratios (phones at 2.625 or 2.75, Windows at 125 % or 150 %), one art pixel then spans an uneven number of physical pixels and the art blurs or shimmers. The world is instead drawn at the smallest whole number of physical pixels per art pixel that is at least `ceil(2 × devicePixelRatio)` and covers the viewport, and its position is rounded to whole physical pixels. The CSS scale becomes fractional, for example about 2.29× at a ratio of 2.625, so avatars are slightly larger or smaller from device to device. This supersedes ADR-0015's scale rule; following the local player and clamping to the Map's edges still hold.

## Considered options

- Whole CSS scale (ADR-0015): uniform CSS size, but uneven pixels on fractional ratios.
- Rendering at a resolution of 1 and letting the browser upscale the canvas: simple, but the browser smooths the upscaled image.
