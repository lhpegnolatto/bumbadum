import { type GameMap, isWalkable, type Tile } from "./map.ts";
import { type Direction, OFFSETS } from "./step.ts";

/** How many tiles ahead a Confetti throw reaches. */
export const CONFETTI_THROW_REACH = 3;

/** Where a Confetti throw lands. */
export interface ThrowTarget {
  /** In tiles, a tile's own coordinates being its middle. */
  at: { x: number; y: number };
  /** Whether it lands on a Player. */
  onPlayer: boolean;
}

/**
 * Where confetti thrown from `from` towards `direction` lands. `isOccupied` says whether a
 * Player other than the thrower stands on a tile.
 */
export function throwTarget(
  map: GameMap,
  from: Tile,
  direction: Direction,
  isOccupied: (tile: Tile) => boolean,
): ThrowTarget {
  const offset = OFFSETS[direction];
  const ahead = (tiles: number) => ({ x: from.x + offset.x * tiles, y: from.y + offset.y * tiles });
  for (let tiles = 1; tiles <= CONFETTI_THROW_REACH; tiles++) {
    const tile = ahead(tiles);
    // Right ahead, it bursts against the blocked tile's edge; further, it drops short of it.
    if (!isWalkable(map, tile))
      return { at: ahead(tiles === 1 ? 0.5 : tiles - 1), onPlayer: false };
    if (isOccupied(tile)) return { at: tile, onPlayer: true };
  }
  return { at: ahead(CONFETTI_THROW_REACH), onPlayer: false };
}
