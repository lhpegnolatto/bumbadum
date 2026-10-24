import type { GameMap } from "@bumbadum/world";

export const TILE_SIZE = 16;

export interface WorldLayout {
  scale: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Fits the complete Map at a whole-number scale and centres it in the viewport. */
export function fitMapToViewport(
  map: Pick<GameMap, "width" | "height">,
  viewportWidth: number,
  viewportHeight: number,
): WorldLayout {
  const mapWidth = map.width * TILE_SIZE;
  const mapHeight = map.height * TILE_SIZE;
  const fit = Math.min(viewportWidth / mapWidth, viewportHeight / mapHeight);
  if (fit < 1) {
    throw new RangeError("Map does not fit in the viewport at its native scale");
  }
  const scale = Math.floor(fit);
  const width = mapWidth * scale;
  const height = mapHeight * scale;
  return {
    scale,
    x: Math.floor((viewportWidth - width) / 2),
    y: Math.floor((viewportHeight - height) / 2),
    width,
    height,
  };
}
