import { isWalkable, lobbyMap } from "@bumbadum/world";
import { describe, expect, it } from "vitest";
import { objectDepth, playerDepth } from "./index.ts";
import { PLAZA_OBJECTS } from "./plaza-objects.generated.ts";

/** A player on tile row 12 stands with their feet on world pixel row 208. */
const onRow12 = { x: 30, y: 12 };

describe("depth order", () => {
  it("draws an object whose base is below a player's feet in front of them", () => {
    expect(objectDepth({ base: 209 })).toBeGreaterThan(playerDepth(onRow12));
  });

  it("draws an object whose base is above a player's feet behind them", () => {
    expect(objectDepth({ base: 207 })).toBeLessThan(playerDepth(onRow12));
  });

  it("draws a player level with an object's base in front of it", () => {
    expect(playerDepth(onRow12)).toBeGreaterThan(objectDepth({ base: 208 }));
  });

  it("moves a gliding player in front once their feet pass an object's base", () => {
    const tree = { base: 200 };
    expect(playerDepth({ x: 30, y: 11.4 })).toBeLessThan(objectDepth(tree));
    expect(playerDepth({ x: 30, y: 11.6 })).toBeGreaterThan(objectDepth(tree));
  });

  it("seats a player on an audience chair behind its backrest", () => {
    const chairs = PLAZA_OBJECTS.filter((object) => object.name === "chair");
    expect(chairs).toHaveLength(24);
    for (const chair of chairs) {
      // The seat is the tile the chair mostly covers: the one whose bottom edge its legs overhang.
      const row = Math.floor(chair.base / 16) - 1;
      const columns = [
        Math.floor(chair.x / 16),
        Math.floor((chair.x + chair.frame.width - 1) / 16),
      ];
      for (const column of columns) {
        const seat = { x: column, y: row };
        expect(isWalkable(lobbyMap, seat), `chair tile ${column},${row}`).toBe(true);
        expect(playerDepth(seat)).toBeLessThan(objectDepth(chair));
        expect(playerDepth({ x: column, y: row + 1 })).toBeGreaterThan(objectDepth(chair));
      }
    }
  });
});
