import { describe, expect, it } from "vitest";
import { DIRECTIONS, isWalkable, lobbyMap, step, type Tile } from "./index.ts";

const key = (tile: Tile) => `${tile.x},${tile.y}`;

function allTiles(): Tile[] {
  return Array.from({ length: lobbyMap.width * lobbyMap.height }, (_, i) => ({
    x: i % lobbyMap.width,
    y: Math.floor(i / lobbyMap.width),
  }));
}

describe("lobbyMap", () => {
  it("is the 60 by 40 tile plaza", () => {
    expect({ width: lobbyMap.width, height: lobbyMap.height }).toEqual({ width: 60, height: 40 });
  });

  it("spawns players on a walkable tile in the open plaza below the audience", () => {
    expect(lobbyMap.spawnPoint).toEqual({ x: 30, y: 22 });
    expect(isWalkable(lobbyMap, lobbyMap.spawnPoint)).toBe(true);
  });

  it("lets a player reach every walkable tile from the spawn point", () => {
    const reached = new Set([key(lobbyMap.spawnPoint)]);
    const frontier = [lobbyMap.spawnPoint];
    for (let tile = frontier.pop(); tile; tile = frontier.pop()) {
      for (const direction of DIRECTIONS) {
        const next = step(lobbyMap, tile, direction).tile;
        if (!reached.has(key(next))) {
          reached.add(key(next));
          frontier.push(next);
        }
      }
    }

    const walkable = allTiles().filter((t) => isWalkable(lobbyMap, t));
    expect(walkable.filter((t) => !reached.has(key(t)))).toEqual([]);
    expect(walkable.length).toBeGreaterThan(1500);
  });

  it("keeps the cleared central dance area walkable", () => {
    const chairColumns = [22, 25, 28, 31, 33, 36];
    const clearedRows = [12, 14, 16, 18];
    const clearedTiles = clearedRows.flatMap((y) => chairColumns.map((x) => ({ x, y })));

    expect(clearedTiles).toHaveLength(24);
    expect(clearedTiles.every((tile) => isWalkable(lobbyMap, tile))).toBe(true);
  });

  it("blocks the stage and the buildings", () => {
    expect(isWalkable(lobbyMap, { x: 30, y: 4 })).toBe(false);
    expect(isWalkable(lobbyMap, { x: 2, y: 4 })).toBe(false);
    expect(isWalkable(lobbyMap, { x: 57, y: 34 })).toBe(false);
  });
});
