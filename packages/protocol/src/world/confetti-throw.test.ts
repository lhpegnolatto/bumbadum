import { describe, expect, it } from "vitest";
import { isConfettiThrowIntent } from "../index.ts";

describe("isConfettiThrowIntent", () => {
  it("accepts only an intent without a payload: the room knows where the player stands", () => {
    expect(isConfettiThrowIntent(undefined)).toBe(true);
    expect(isConfettiThrowIntent(null)).toBe(false);
    expect(isConfettiThrowIntent("down")).toBe(false);
    expect(isConfettiThrowIntent({ at: { x: 3, y: 4 } })).toBe(false);
  });
});
