import { describe, expect, it } from "vitest";
import {
  DIRECTIONS,
  isWalkable,
  lobbyCarCollisionWorld,
  lobbyMap,
  step,
  type Tile,
} from "./index.ts";

const key = (tile: Tile) => `${tile.x},${tile.y}`;

function allTiles(): Tile[] {
  return Array.from({ length: lobbyMap.width * lobbyMap.height }, (_, i) => ({
    x: i % lobbyMap.width,
    y: Math.floor(i / lobbyMap.width),
  }));
}

describe("lobbyMap", () => {
  it("is the 150 by 40 plaza with the tennis and autodrome extensions", () => {
    expect({ width: lobbyMap.width, height: lobbyMap.height }).toEqual({ width: 150, height: 40 });
  });

  it("spawns players on a walkable tile in the plaza", () => {
    expect(lobbyMap.spawnPoint).toEqual({ x: 70, y: 19 });
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

  it("keeps the plaza spawn and autodrome approach walkable", () => {
    expect(isWalkable(lobbyMap, { x: 120, y: 22 })).toBe(true);
    expect(isWalkable(lobbyMap, { x: 140, y: 22 })).toBe(true);
  });

  it("keeps the former center chair area walkable", () => {
    const formerChairTiles = [
      { x: 63, y: 14 },
      { x: 68, y: 14 },
      { x: 71, y: 14 },
      { x: 74, y: 14 },
      { x: 63, y: 16 },
      { x: 68, y: 16 },
      { x: 71, y: 16 },
      { x: 74, y: 16 },
      { x: 63, y: 18 },
      { x: 68, y: 18 },
      { x: 71, y: 18 },
      { x: 74, y: 18 },
    ];

    for (const tile of formerChairTiles) {
      expect(isWalkable(lobbyMap, tile)).toBe(true);
    }
  });

  it("keeps the parking exit open for cars", () => {
    for (let x = 101; x <= 113; x += 1) {
      expect(isWalkable(lobbyMap, { x, y: 22 })).toBe(true);
      expect(lobbyCarCollisionWorld.isBlocked(x * 16 + 8, 22 * 16 + 8)).toBe(false);
    }
  });

  it("keeps the marked autodrome surface free for cars", () => {
    expect(lobbyCarCollisionWorld.isBlocked(80 * 16 + 8, 10 * 16 + 8)).toBe(false);
  });

  it("blocks the stage and the buildings", () => {
    expect(isWalkable(lobbyMap, { x: 70, y: 4 })).toBe(false);
    expect(isWalkable(lobbyMap, { x: 42, y: 4 })).toBe(false);
    expect(isWalkable(lobbyMap, { x: 97, y: 34 })).toBe(false);
  });
});
