import { describe, expect, it } from "vitest";
import { fitMapToViewport } from "./index.ts";

const map = { width: 20, height: 15 };

describe("fitMapToViewport", () => {
  it.each([
    ["a matching 4:3 viewport", 640, 480, { scale: 2, x: 0, y: 0 }],
    ["a widescreen viewport", 1280, 720, { scale: 3, x: 160, y: 0 }],
    ["a tall viewport", 640, 960, { scale: 2, x: 0, y: 240 }],
    ["the minimum supported viewport", 1024, 640, { scale: 2, x: 192, y: 80 }],
  ])("centres the complete map in %s", (_name, width, height, expected) => {
    expect(fitMapToViewport(map, width, height)).toEqual({
      ...expected,
      width: 320 * expected.scale,
      height: 240 * expected.scale,
    });
  });

  it("rejects a map that cannot fit at its native scale", () => {
    expect(() => fitMapToViewport(map, 319, 240)).toThrow(RangeError);
  });
});
