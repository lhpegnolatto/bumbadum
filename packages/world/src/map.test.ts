import { describe, expect, it } from "vitest";
import { createMap, isWalkable } from "./index.ts";

describe("createMap", () => {
  it("reads blocked tiles, walkable tiles and the spawn point from rows", () => {
    const map = createMap(["###", "#S.", "###"]);

    expect({ width: map.width, height: map.height }).toEqual({ width: 3, height: 3 });
    expect(map.spawnPoint).toEqual({ x: 1, y: 1 });
    expect(isWalkable(map, { x: 1, y: 1 })).toBe(true);
    expect(isWalkable(map, { x: 2, y: 1 })).toBe(true);
    expect(isWalkable(map, { x: 0, y: 1 })).toBe(false);
    expect(isWalkable(map, { x: 1, y: 0 })).toBe(false);
  });

  it("treats tiles outside the map as blocked", () => {
    const map = createMap(["S."]);

    expect(isWalkable(map, { x: -1, y: 0 })).toBe(false);
    expect(isWalkable(map, { x: 2, y: 0 })).toBe(false);
    expect(isWalkable(map, { x: 0, y: 1 })).toBe(false);
  });

  it("refuses a layout without exactly one spawn point", () => {
    expect(() => createMap(["#.."])).toThrow();
    expect(() => createMap(["S.S"])).toThrow();
  });

  it("refuses rows of different lengths and unknown tiles", () => {
    expect(() => createMap(["S..", ".."])).toThrow();
    expect(() => createMap(["S.x"])).toThrow();
  });
});
