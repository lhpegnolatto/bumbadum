import { describe, expect, it } from "vitest";
import { createMap, type Tile, throwTarget } from "./index.ts";

const map = createMap([
  "#######", //
  "#.....#",
  "#..S..#",
  "#.....#",
  "#.....#",
  "#######",
]);

const nobody = () => false;

describe("throwTarget", () => {
  it("lands on the floor three tiles ahead when nothing is in the way", () => {
    expect(throwTarget(map, { x: 3, y: 1 }, "down", nobody)).toEqual({
      at: { x: 3, y: 4 },
      onPlayer: false,
    });
  });

  it("lands on the first Player ahead, ignoring one on the thrower's own tile", () => {
    const players: Tile[] = [
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 5, y: 2 },
    ];
    const occupied = (tile: Tile) => players.some((p) => p.x === tile.x && p.y === tile.y);

    expect(throwTarget(map, { x: 3, y: 2 }, "right", occupied)).toEqual({
      at: { x: 4, y: 2 },
      onPlayer: true,
    });
    expect(throwTarget(map, { x: 3, y: 2 }, "left", occupied)).toEqual({
      at: { x: 1, y: 2 },
      onPlayer: false,
    });
  });

  it("lands on the last floor tile before a blocked tile within reach", () => {
    expect(throwTarget(map, { x: 2, y: 2 }, "up", nobody)).toEqual({
      at: { x: 2, y: 1 },
      onPlayer: false,
    });
  });

  it("bursts half a tile ahead against a blocked tile right ahead, in every direction", () => {
    expect(throwTarget(map, { x: 1, y: 1 }, "up", nobody).at).toEqual({ x: 1, y: 0.5 });
    expect(throwTarget(map, { x: 1, y: 1 }, "left", nobody).at).toEqual({ x: 0.5, y: 1 });
    expect(throwTarget(map, { x: 5, y: 4 }, "down", nobody).at).toEqual({ x: 5, y: 4.5 });
    expect(throwTarget(map, { x: 5, y: 4 }, "right", nobody).at).toEqual({ x: 5.5, y: 4 });
  });

  it("never lands on a Player behind a blocked tile", () => {
    const behindTheWall = (tile: Tile) => tile.x === 2 && tile.y === 0;

    expect(throwTarget(map, { x: 2, y: 1 }, "up", behindTheWall)).toEqual({
      at: { x: 2, y: 0.5 },
      onPlayer: false,
    });
  });
});
