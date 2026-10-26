import { describe, expect, it } from "vitest";
import { activeCarDirection } from "./car-keyboard.ts";

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
});
