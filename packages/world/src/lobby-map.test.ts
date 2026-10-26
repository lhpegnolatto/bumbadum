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
  it("is the 110 by 40 plaza with the autodrome extension", () => {
    expect({ width: lobbyMap.width, height: lobbyMap.height }).toEqual({ width: 110, height: 40 });
  });

  it("spawns players on a walkable tile in the plaza", () => {
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

  it("keeps the plaza spawn and autodrome approach walkable", () => {
    expect(isWalkable(lobbyMap, { x: 80, y: 22 })).toBe(true);
    expect(isWalkable(lobbyMap, { x: 100, y: 22 })).toBe(true);
  });

  it("keeps the marked autodrome surface free for cars", () => {
    expect(lobbyCarCollisionWorld.isBlocked(80 * 16 + 8, 10 * 16 + 8)).toBe(false);
  });

  it("blocks the stage and the buildings", () => {
    expect(isWalkable(lobbyMap, { x: 30, y: 4 })).toBe(false);
    expect(isWalkable(lobbyMap, { x: 2, y: 4 })).toBe(false);
    expect(isWalkable(lobbyMap, { x: 57, y: 34 })).toBe(false);
  });
});
