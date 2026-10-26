import { describe, expect, it } from "vitest";
import { isTennisHallPosition, tennisDirectionForKey } from "./tennis.ts";

describe("Tennis room helpers", () => {
  it("recognizes the hall interior and excludes the plaza", () => {
    expect(isTennisHallPosition(30, 25)).toBe(true);
    expect(isTennisHallPosition(21, 25)).toBe(false);
    expect(isTennisHallPosition(30, 38)).toBe(false);
  });

  it("maps horizontal keyboard input to Tennis steering", () => {
    expect(tennisDirectionForKey("ArrowLeft".toLowerCase())).toBe("left");
    expect(tennisDirectionForKey("d")).toBe("right");
    expect(tennisDirectionForKey("w")).toBeNull();
  });
});
