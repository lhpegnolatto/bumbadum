import type { GameMap } from "@bumbadum/world";

export const TILE_SIZE = 16;

/** Below this scale avatars are too small to read (ADR-0015). */
const MIN_SCALE = 2;

/** How the world is drawn in the viewport: its scale and where its top-left corner lands. */
export interface Camera {
  scale: number;
  x: number;
  y: number;
}

/**
 * Frames the Map at the smallest whole-number scale of at least 2× that covers the viewport,
 * centred on `focus` (in world pixels) but never showing beyond the Map's edges (ADR-0015).
 */
export function cameraOn(
  map: Pick<GameMap, "width" | "height">,
  viewport: { width: number; height: number },
  focus: { x: number; y: number },
): Camera {
  const mapWidth = map.width * TILE_SIZE;
  const mapHeight = map.height * TILE_SIZE;
  const scale = Math.max(
    MIN_SCALE,
    Math.ceil(viewport.width / mapWidth),
    Math.ceil(viewport.height / mapHeight),
  );
  return {
    scale,
    x: follow(focus.x * scale, viewport.width, mapWidth * scale),
    y: follow(focus.y * scale, viewport.height, mapHeight * scale),
  };
}

/**
 * Where the world starts on one axis, in whole screen pixels, so `focus` is centred
 * without showing beyond the Map.
 */
function follow(focus: number, viewport: number, map: number): number {
  return Math.round(Math.min(0, Math.max(viewport - map, viewport / 2 - focus)));
}
