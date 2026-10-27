import type { GameMap } from "@bumbadum/world";

export const TILE_SIZE = 16;

/** Below this CSS scale avatars are too small to read (ADR-0015). */
const MIN_SCALE = 2;

/**
 * How the world is drawn in the viewport: its scale and where its top-left corner lands, in CSS
 * pixels, and the resolution its scene renders at.
 */
export interface Camera {
  scale: number;
  x: number;
  y: number;
  /** Scene texels per CSS pixel, the resolution the scene renders at under the Ambient light. */
  sceneResolution: number;
  /**
   * Where the scene's texture lands, in CSS pixels: on the world's texel grid at or just before
   * the viewport's corner, so the world sits on whole texels inside it while the texture slides
   * with the camera by whole physical pixels (ADR-0032).
   */
  sceneX: number;
  sceneY: number;
}

/**
 * Frames the Map at the smallest whole number of physical pixels per art pixel that is at
 * least `ceil(2 × devicePixelRatio)` and covers the viewport, centred on `focus` (in world
 * pixels) but never showing beyond the Map's edges (ADR-0015, ADR-0017). The focus is centred
 * in the visible area below `topInset` CSS pixels, such as the Screen on a phone, while the
 * world still covers the whole viewport (ADR-0018).
 */
export function cameraOn(
  map: Pick<GameMap, "width" | "height">,
  viewport: { width: number; height: number },
  focus: { x: number; y: number },
  devicePixelRatio: number,
  topInset = 0,
): Camera {
  const mapWidth = map.width * TILE_SIZE;
  const mapHeight = map.height * TILE_SIZE;
  const physicalPerArtPixel = Math.max(
    Math.ceil(MIN_SCALE * devicePixelRatio),
    Math.ceil((viewport.width * devicePixelRatio) / mapWidth),
    Math.ceil((viewport.height * devicePixelRatio) / mapHeight),
  );
  const scale = physicalPerArtPixel / devicePixelRatio;
  const physicalPerTexel = physicalPerSceneTexel(physicalPerArtPixel);
  // Whole physical pixels, so texel arithmetic below stays exact.
  const x = Math.round(
    follow(focus.x * scale, viewport.width, mapWidth * scale) * devicePixelRatio,
  );
  const y = Math.round(
    follow(focus.y * scale, viewport.height, mapHeight * scale, topInset) * devicePixelRatio,
  );
  const textureOrigin = (physical: number) =>
    (physical - Math.ceil(physical / physicalPerTexel) * physicalPerTexel) / devicePixelRatio;
  return {
    scale,
    x: x / devicePixelRatio,
    y: y / devicePixelRatio,
    sceneResolution: devicePixelRatio / physicalPerTexel,
    sceneX: textureOrigin(x),
    sceneY: textureOrigin(y),
  };
}

/**
 * Splits an art pixel into the fewest whole texels, at least two, so motion steps half an art
 * pixel at most; an art pixel of 2 physical pixels, the smallest, is one texel (ADR-0031).
 */
function physicalPerSceneTexel(physicalPerArtPixel: number): number {
  if (physicalPerArtPixel <= 2) return physicalPerArtPixel;
  for (let texels = 2; texels < physicalPerArtPixel; texels++) {
    if (physicalPerArtPixel % texels === 0) return physicalPerArtPixel / texels;
  }
  return 1;
}

/**
 * Where the world starts on one axis, in CSS pixels, so `focus` is centred in the part of the
 * viewport past `inset` without showing beyond the Map.
 */
function follow(focus: number, viewport: number, map: number, inset = 0): number {
  return Math.min(0, Math.max(viewport - map, (viewport + inset) / 2 - focus));
}
