/** A tile of the map, in tile coordinates from the top-left corner. */
export interface Tile {
  x: number;
  y: number;
}

/** The grid of tiles that makes up a room's floor and walls. */
export interface GameMap {
  readonly width: number;
  readonly height: number;
  readonly spawnPoint: Tile;
  /** Row-major: the tile at (x, y) is `blocked[y * width + x]`. */
  readonly blocked: readonly boolean[];
}

const BLOCKED = "#";
const WALKABLE = ".";
const SPAWN_POINT = "S";

/**
 * Builds a map from rows of characters, one per tile: `#` blocked, `.` walkable,
 * `S` the spawn point (walkable).
 */
export function createMap(rows: readonly string[]): GameMap {
  const width = rows[0]?.length ?? 0;
  const blocked: boolean[] = [];
  let spawnPoint: Tile | undefined;
  rows.forEach((row, y) => {
    if (row.length !== width) throw new Error(`map row ${y} is not ${width} tiles wide`);
    [...row].forEach((char, x) => {
      if (char !== BLOCKED && char !== WALKABLE && char !== SPAWN_POINT) {
        throw new Error(`unknown tile "${char}" at ${x},${y}`);
      }
      if (char === SPAWN_POINT) {
        if (spawnPoint) throw new Error("the map has more than one spawn point");
        spawnPoint = { x, y };
      }
      blocked.push(char === BLOCKED);
    });
  });
  if (!spawnPoint) throw new Error("the map needs a spawn point");
  return { width, height: rows.length, spawnPoint, blocked };
}

/** Whether a player may stand on `tile`. Tiles outside the map are blocked. */
export function isWalkable(map: GameMap, tile: Tile): boolean {
  if (tile.x < 0 || tile.y < 0 || tile.x >= map.width || tile.y >= map.height) return false;
  return map.blocked[tile.y * map.width + tile.x] === false;
}
