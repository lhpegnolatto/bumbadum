import { describe, expect, it } from "vitest";
import { createMap, isDirection, step } from "./index.ts";

const map = createMap([
  "#####", //
  "#...#",
  "#.S.#",
  "#..##",
  "#####",
]);

describe("step", () => {
  it("moves exactly one tile in each direction", () => {
    const from = map.spawnPoint;

    expect(step(map, from, "up")).toEqual({ tile: { x: 2, y: 1 }, moved: true });
    expect(step(map, from, "down")).toEqual({ tile: { x: 2, y: 3 }, moved: true });
    expect(step(map, from, "left")).toEqual({ tile: { x: 1, y: 2 }, moved: true });
    expect(step(map, from, "right")).toEqual({ tile: { x: 3, y: 2 }, moved: true });
  });

  it("stays on the tile when the tile ahead is blocked", () => {
    expect(step(map, { x: 3, y: 2 }, "down")).toEqual({ tile: { x: 3, y: 2 }, moved: false });
    expect(step(map, { x: 1, y: 1 }, "up")).toEqual({ tile: { x: 1, y: 1 }, moved: false });
  });

  it("never leaves the map", () => {
    const open = createMap(["S"]);

    expect(step(open, open.spawnPoint, "left")).toEqual({ tile: { x: 0, y: 0 }, moved: false });
  });
});

describe("isDirection", () => {
  it("accepts the four directions only", () => {
    expect(["up", "down", "left", "right"].every(isDirection)).toBe(true);
    expect(isDirection("north")).toBe(false);
    expect(isDirection(1)).toBe(false);
  });
});
