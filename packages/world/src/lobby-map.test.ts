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
  it("is 20 by 15 tiles", () => {
    expect({ width: lobbyMap.width, height: lobbyMap.height }).toEqual({ width: 20, height: 15 });
  });

  it("is closed by walls, so nobody walks off its edge", () => {
    const edge = allTiles().filter(
      (t) => t.x === 0 || t.y === 0 || t.x === lobbyMap.width - 1 || t.y === lobbyMap.height - 1,
    );
    expect(edge.filter((t) => isWalkable(lobbyMap, t))).toEqual([]);
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
    expect(walkable.length).toBeGreaterThan(150);
  });
});
