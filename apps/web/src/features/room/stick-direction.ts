import type { Direction } from "@bumbadum/game-engine";

/** How far from the centre, as a share of the stick's radius, the thumb must go to steer. */
const DEAD_ZONE = 0.3;
/**
 * How much longer the other axis must be than the current direction's axis before the stick turns
 * to it: about 51° from the current axis instead of the diagonal's 45°, so a thumb resting near a
 * diagonal does not flicker between two directions.
 */
const AXIS_SWITCH_RATIO = 1.25;

/**
 * The direction the thumb steers, from its offset to the stick's centre in units of the stick's
 * radius (screen axes: `y` grows downwards), given the direction it steers now.
 */
export function stickDirection(
  offset: { x: number; y: number },
  current: Direction | null,
): Direction | null {
  const across = Math.abs(offset.x);
  const along = Math.abs(offset.y);
  if (Math.hypot(across, along) < DEAD_ZONE) return null;

  let horizontal = across > along;
  if (current === "left" || current === "right") horizontal = along <= across * AXIS_SWITCH_RATIO;
  if (current === "up" || current === "down") horizontal = across > along * AXIS_SWITCH_RATIO;

  if (horizontal) return offset.x < 0 ? "left" : "right";
  return offset.y < 0 ? "up" : "down";
}
