export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * Where a speech bubble's top-left corner goes: centred above `anchor` (the
 * point just over the speaker's head), shifted to stay inside the full-viewport
 * canvas. Room UI overlays may still visually occlude a bubble.
 */
export function placeBubble(anchor: Point, bubble: Size, canvas: Size): Point {
  return {
    x: clamp(anchor.x - bubble.width / 2, 0, canvas.width - bubble.width),
    y: clamp(anchor.y - bubble.height, 0, canvas.height - bubble.height),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}
