import { describe, expect, it } from "vitest";
import { cameraOn } from "./index.ts";

/** The plaza's size: 960×640 px at its native scale. */
const map = { width: 60, height: 40 };
const middle = { x: 480, y: 320 };

describe("cameraOn", () => {
  it.each([
    [1024, 640, 2],
    [1920, 1080, 2],
    [2560, 1440, 3],
    [3840, 2160, 4],
  ])("draws a %ix%i viewport at %ix", (width, height, scale) => {
    expect(cameraOn(map, { width, height }, middle).scale).toBe(scale);
  });

  it("centres the viewport on the focus", () => {
    // At 2x the focus lands on screen pixel (960, 640); the viewport's centre is (512, 320).
    expect(cameraOn(map, { width: 1024, height: 640 }, middle)).toEqual({
      scale: 2,
      x: -448,
      y: -320,
    });
  });

  // At 2x the 1024×640 viewport sees 512×320 world px: x stays in [-896, 0] and y in [-640, 0].
  it.each([
    ["top edge", { x: 480, y: 10 }, { x: -448, y: 0 }],
    ["bottom edge", { x: 480, y: 630 }, { x: -448, y: -640 }],
    ["left edge", { x: 10, y: 320 }, { x: 0, y: -320 }],
    ["right edge", { x: 950, y: 320 }, { x: -896, y: -320 }],
    ["top-left corner", { x: 0, y: 0 }, { x: 0, y: 0 }],
    ["top-right corner", { x: 960, y: 0 }, { x: -896, y: 0 }],
    ["bottom-left corner", { x: 0, y: 640 }, { x: 0, y: -640 }],
    ["bottom-right corner", { x: 960, y: 640 }, { x: -896, y: -640 }],
  ])("stops at the Map's %s", (_edge, focus, offset) => {
    expect(cameraOn(map, { width: 1024, height: 640 }, focus)).toEqual({ scale: 2, ...offset });
  });

  it("rounds a gliding focus to whole screen pixels", () => {
    // Unrounded, the world would start at (-448.6, -321.4).
    expect(cameraOn(map, { width: 1024, height: 640 }, { x: 480.3, y: 320.7 })).toEqual({
      scale: 2,
      x: -449,
      y: -321,
    });
  });

  it("frames a viewport below the supported minimum at 2x", () => {
    expect(cameraOn(map, { width: 800, height: 500 }, middle)).toEqual({
      scale: 2,
      x: -560,
      y: -390,
    });
  });
});
