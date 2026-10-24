import type { GameMap } from "@bumbadum/world";

export const TILE_SIZE = 16;

/** Below this CSS scale avatars are too small to read (ADR-0015). */
const MIN_SCALE = 2;

/** How the world is drawn in the viewport, in CSS pixels: its scale and where its top-left corner lands. */
export interface Camera {
  scale: number;
  x: number;
  y: number;
}

/**
 * Frames the Map at the smallest whole number of physical pixels per art pixel that is at
 * least `ceil(2 × devicePixelRatio)` and covers the viewport, centred on `focus` (in world
 * pixels) but never showing beyond the Map's edges (ADR-0015, ADR-0017).
 */
export function cameraOn(
  map: Pick<GameMap, "width" | "height">,
  viewport: { width: number; height: number },
  focus: { x: number; y: number },
  devicePixelRatio: number,
): Camera {
  const mapWidth = map.width * TILE_SIZE;
  const mapHeight = map.height * TILE_SIZE;
  const physicalPerArtPixel = Math.max(
    Math.ceil(MIN_SCALE * devicePixelRatio),
    Math.ceil((viewport.width * devicePixelRatio) / mapWidth),
    Math.ceil((viewport.height * devicePixelRatio) / mapHeight),
  );
  const scale = physicalPerArtPixel / devicePixelRatio;
  const toPhysicalPixel = (css: number) => Math.round(css * devicePixelRatio) / devicePixelRatio;
  return {
    scale,
    x: toPhysicalPixel(follow(focus.x * scale, viewport.width, mapWidth * scale)),
    y: toPhysicalPixel(follow(focus.y * scale, viewport.height, mapHeight * scale)),
  };
}

/** Where the world starts on one axis, in CSS pixels, so `focus` is centred without showing beyond the Map. */
function follow(focus: number, viewport: number, map: number): number {
  return Math.min(0, Math.max(viewport - map, viewport / 2 - focus));
}
