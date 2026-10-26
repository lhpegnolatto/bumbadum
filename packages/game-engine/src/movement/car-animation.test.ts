import { describe, expect, it } from "vitest";
import { carFrame, fxFrame } from "./car-animation.ts";

describe("carFrame", () => {
  it("uses the supplied direction rows and mirrors left", () => {
    expect(carFrame("down", 0, false, 0)).toEqual({ row: 0, column: 0, mirrored: false });
    expect(carFrame("right", 1, false, 0).mirrored).toBe(false);
    expect(carFrame("left", 1, false, 0)).toEqual({ row: 1, column: 1, mirrored: true });
    expect(carFrame("up", 1, false, 0).row).toBe(2);
  });

  it("alternates walking frames faster at high speed", () => {
    expect(carFrame("right", 2, false, 100).column).toBe(2);
    expect(carFrame("right", 6, false, 60).column).toBe(2);
    expect(carFrame("right", 0, false, 100).column).toBe(0);
  });
});

describe("fxFrame", () => {
  it("loops an effect sheet at its own cadence", () => {
    expect(fxFrame(0, 4, 90)).toBe(0);
    expect(fxFrame(90, 4, 90)).toBe(1);
    expect(fxFrame(360, 4, 90)).toBe(0);
  });
});
