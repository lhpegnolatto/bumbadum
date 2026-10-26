import { describe, expect, it } from "vitest";
import { activeCarDirection, carActionForKey } from "./car-keyboard.ts";

describe("activeCarDirection", () => {
  it("keeps the remaining direction when the latest key is released", () => {
    const pressed = new Map([
      ["arrowright", "right" as const],
      ["arrowdown", "down" as const],
    ]);

    pressed.delete("arrowdown");

    expect(activeCarDirection(pressed)).toBe("right");
  });

  it("stops only when no direction remains pressed", () => {
    expect(activeCarDirection(new Map())).toBeNull();
  });

  it("uses Q to enter a nearby car or exit the current one", () => {
    expect(carActionForKey("q", "", "car-1")).toBe("enter");
    expect(carActionForKey("Q", "car-1", null)).toBe("exit");
    expect(carActionForKey("q", "", null)).toBeNull();
    expect(carActionForKey("e", "", "car-1")).toBeNull();
  });
});
