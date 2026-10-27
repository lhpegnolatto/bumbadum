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
  ])("draws a %ix%i viewport at %ix on a ratio of 1", (width, height, scale) => {
    expect(cameraOn(map, { width, height }, middle, 1).scale).toBe(scale);
  });

  it("centres the viewport on the focus", () => {
    // At 2x the focus lands on screen pixel (960, 640); the viewport's centre is (512, 320).
    expect(cameraOn(map, { width: 1024, height: 640 }, middle, 1)).toEqual({
      scale: 2,
      sceneResolution: 0.5,
      x: -448,
      y: -320,
      sceneX: 0,
      sceneY: 0,
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
    expect(cameraOn(map, { width: 1024, height: 640 }, focus, 1)).toEqual({
      scale: 2,
      sceneResolution: 0.5,
      sceneX: 0,
      sceneY: 0,
      ...offset,
    });
  });

  it("rounds a gliding focus to whole screen pixels", () => {
    // Unrounded, the world would start at (-448.6, -321.4).
    expect(cameraOn(map, { width: 1024, height: 640 }, { x: 480.3, y: 320.7 }, 1)).toEqual({
      scale: 2,
      sceneResolution: 0.5,
      x: -449,
      y: -321,
      // The scene's texels span 2 screen pixels: the texture starts 1 pixel before the viewport,
      // which puts the world at (-448, -320) inside it, on whole texels.
      sceneX: -1,
      sceneY: -1,
    });
  });

  it("frames a viewport below the supported minimum at 2x", () => {
    expect(cameraOn(map, { width: 800, height: 500 }, middle, 1)).toEqual({
      scale: 2,
      sceneResolution: 0.5,
      x: -560,
      y: -390,
      sceneX: 0,
      sceneY: 0,
    });
  });

  // Physical pixels per art pixel: at least ceil(2 × ratio), more when the Map would not cover the viewport.
  it.each([
    [1, 1024, 640, 2],
    [1.25, 1024, 640, 3],
    [1.25, 2560, 1440, 4],
    [2, 1024, 640, 4],
    [2, 3840, 2160, 8],
    [2.625, 412, 915, 6],
    [2.625, 2560, 1440, 7],
    [3, 1920, 1080, 6],
    [3, 2560, 1440, 8],
  ])(
    "on a ratio of %d draws a %ix%i viewport at %i physical pixels per art pixel",
    (ratio, width, height, physical) => {
      expect(cameraOn(map, { width, height }, middle, ratio).scale * ratio).toBeCloseTo(
        physical,
        9,
      );
    },
  );

  // Physical pixels per scene texel: an art pixel splits into the fewest whole texels, at least two,
  // so motion steps half an art pixel at most; an art pixel of 2 physical pixels is one texel.
  it.each([
    [1, 1024, 640, 2],
    [1, 2560, 1440, 1],
    [1.25, 1024, 640, 1],
    [2, 1024, 640, 2],
    [2, 3840, 2160, 4],
    [2.625, 412, 915, 3],
    [2.625, 2560, 1440, 1],
    [3, 1920, 1080, 3],
  ])(
    "on a ratio of %d renders a %ix%i viewport's scene at %i physical pixels per texel",
    (ratio, width, height, physical) => {
      expect(ratio / cameraOn(map, { width, height }, middle, ratio).sceneResolution).toBeCloseTo(
        physical,
        9,
      );
    },
  );

  it.each([
    [1.25, 2.4],
    [2.625, 2.2857],
  ])("on a ratio of %d draws the world at a fractional CSS scale of %d", (ratio, scale) => {
    expect(cameraOn(map, { width: 1024, height: 640 }, middle, ratio).scale).toBeCloseTo(scale, 4);
  });

  it("on a ratio of 1.25 rounds the world's offset to whole physical pixels", () => {
    // Unrounded, the world would start at (-800.9, -562.1) physical pixels.
    const camera = cameraOn(map, { width: 1024, height: 640 }, { x: 480.3, y: 320.7 }, 1.25);
    expect(camera.x * 1.25).toBeCloseTo(-801, 9);
    expect(camera.y * 1.25).toBeCloseTo(-562, 9);
  });

  it.each([
    // Unrounded: (-2339.25, -719.07) and (-1680.6, -841.2) physical pixels.
    [2.625, 412, 915, middle, { x: -2339, y: -719 }],
    [3, 1280, 720, { x: 600.1, y: 320.2 }, { x: -1681, y: -841 }],
  ])(
    "on a ratio of %d rounds the world's offset to whole physical pixels",
    (ratio, width, height, focus, physical) => {
      const camera = cameraOn(map, { width, height }, focus, ratio);
      expect(camera.x * ratio).toBeCloseTo(physical.x, 9);
      expect(camera.y * ratio).toBeCloseTo(physical.y, 9);
    },
  );

  // The scene starts on the scene texel at or just before the world's offset, by whole physical
  // pixels, so it slides with the camera while its art stays on its texels.
  it.each([
    // Texels of 3 physical pixels: the world at (-2339, -719) sits on texels at (-2337, -717).
    [2.625, 412, 915, middle, { x: -2, y: -2 }],
    // Texels of 3 physical pixels: the world at (-1681, -841) sits on texels at (-1680, -840).
    [3, 1280, 720, { x: 600.1, y: 320.2 }, { x: -1, y: -1 }],
    // Texels of 1 physical pixel: the scene starts where the world does.
    [1.25, 1024, 640, { x: 480.3, y: 320.7 }, { x: 0, y: 0 }],
  ])(
    "on a ratio of %d starts the scene a part of a texel before the viewport",
    (ratio, width, height, focus, physical) => {
      const camera = cameraOn(map, { width, height }, focus, ratio);
      expect(camera.sceneX * ratio).toBeCloseTo(physical.x, 9);
      expect(camera.sceneY * ratio).toBeCloseTo(physical.y, 9);
    },
  );

  it("on a fractional ratio still stops at the Map's edges", () => {
    // At 2.4x the 1024×640 viewport sees the Map as 2304×1536 CSS px.
    const camera = cameraOn(map, { width: 1024, height: 640 }, { x: 960, y: 640 }, 1.25);
    expect(camera.x).toBeCloseTo(-1280, 9);
    expect(camera.y).toBeCloseTo(-896, 9);
  });

  describe("under a top inset, such as the Screen on a phone", () => {
    // 360×780 at 2x sees 180×390 world px; the 260 px inset leaves the 520 px below it visible.
    const phone = { width: 360, height: 780 };
    const inset = 260;

    it("centres the focus in the visible area beneath the inset", () => {
      // The visible area's centre is at y = (780 + 260) / 2 = 520; the focus lands on y = 640 at 2x.
      expect(cameraOn(map, phone, middle, 1, inset)).toEqual({
        scale: 2,
        sceneResolution: 0.5,
        x: -780,
        y: -120,
        sceneX: 0,
        sceneY: 0,
      });
    });

    it("still stops at the Map's top edge, drawing the world behind the inset", () => {
      expect(cameraOn(map, phone, { x: 480, y: 10 }, 1, inset)).toEqual({
        scale: 2,
        sceneResolution: 0.5,
        x: -780,
        y: 0,
        sceneX: 0,
        sceneY: 0,
      });
    });

    it("still stops at the Map's bottom edge at the viewport's bottom", () => {
      expect(cameraOn(map, phone, { x: 480, y: 630 }, 1, inset)).toEqual({
        scale: 2,
        sceneResolution: 0.5,
        x: -780,
        y: -500,
        sceneX: 0,
        sceneY: 0,
      });
    });
  });
});
