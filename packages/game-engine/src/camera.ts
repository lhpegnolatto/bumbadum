import type { GameMap } from "@bumbadum/world";

export const TILE_SIZE = 16;

/** Below this CSS scale avatars are too small to read (ADR-0015). */
const MIN_SCALE = 2;

/** A scene texel covers at least this many physical pixels a side, which bounds the GPU's fill. */
const MIN_PHYSICAL_PER_SCENE_TEXEL = 3;

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
}

/**
 * Frames the Map at the smallest whole number of physical pixels per art pixel that is at
 * least `ceil(2 × devicePixelRatio)` and covers the viewport, centred on `focus` (in world
 * pixels) but never showing beyond the Map's edges (ADR-0015, ADR-0017), and on whole scene
 * texels of a few physical pixels each (ADR-0031). The focus is centred
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
  const sceneResolution = devicePixelRatio / physicalPerSceneTexel(physicalPerArtPixel);
  const texelWidth = 1 / sceneResolution;
  return {
    scale,
    x: follow(focus.x * scale, viewport.width, mapWidth * scale, texelWidth),
    y: follow(focus.y * scale, viewport.height, mapHeight * scale, texelWidth, topInset),
    sceneResolution,
  };
}

/**
 * The smallest whole number of physical pixels that evenly divides an art pixel and is at least
 * `MIN_PHYSICAL_PER_SCENE_TEXEL`, or the whole art pixel when no smaller one does (ADR-0031).
 */
function physicalPerSceneTexel(physicalPerArtPixel: number): number {
  for (let candidate = MIN_PHYSICAL_PER_SCENE_TEXEL; candidate < physicalPerArtPixel; candidate++) {
    if (physicalPerArtPixel % candidate === 0) return candidate;
  }
  return physicalPerArtPixel;
}

/**
 * Where the world starts on one axis, in CSS pixels, so `focus` is centred in the part of the
 * viewport past `inset` without showing beyond the Map, on a whole texel `texelWidth` CSS pixels
 * wide so art pixels line up with the scene's texels.
 */
function follow(
  focus: number,
  viewport: number,
  map: number,
  texelWidth: number,
  inset = 0,
): number {
  const centred = Math.round(((viewport + inset) / 2 - focus) / texelWidth) * texelWidth;
  const farEdge = Math.ceil((viewport - map) / texelWidth) * texelWidth;
  return Math.min(0, Math.max(farEdge, centred));
}
