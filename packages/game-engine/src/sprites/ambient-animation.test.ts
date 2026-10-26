import { describe, expect, it } from "vitest";
import { ambientFrame, ambientStartFrame } from "../index.ts";

/** A tree's sway: four frames of 180 ms. */
const SWAY = [180, 180, 180, 180];

describe("ambientFrame", () => {
  it("shows each frame for its duration and loops", () => {
    const at = (now: number) => ambientFrame(SWAY, now, 0, false);

    expect(at(0)).toBe(0);
    expect(at(179)).toBe(0);
    expect(at(180)).toBe(1);
    expect(at(540)).toBe(3);
    expect(at(719)).toBe(3);
    expect(at(720)).toBe(0);
    expect(at(2_700)).toBe(3);
  });

  it("follows each frame's own duration", () => {
    const at = (now: number) => ambientFrame([100, 300, 50], now, 0, false);

    expect(at(99)).toBe(0);
    expect(at(100)).toBe(1);
    expect(at(399)).toBe(1);
    expect(at(400)).toBe(2);
    expect(at(450)).toBe(0);
  });

  it("starts the loop at the starting frame", () => {
    expect(ambientFrame(SWAY, 0, 2, false)).toBe(2);
    expect(ambientFrame(SWAY, 179, 2, false)).toBe(2);
    expect(ambientFrame(SWAY, 180, 2, false)).toBe(3);
    expect(ambientFrame(SWAY, 360, 2, false)).toBe(0);
    // With frames of their own lengths, the starting frame still lasts its full duration.
    expect(ambientFrame([100, 300, 50], 0, 1, false)).toBe(1);
    expect(ambientFrame([100, 300, 50], 299, 1, false)).toBe(1);
    expect(ambientFrame([100, 300, 50], 300, 1, false)).toBe(2);
  });

  it("holds the first frame under reduced motion", () => {
    for (const now of [0, 200, 400, 600]) {
      expect(ambientFrame(SWAY, now, 3, true)).toBe(0);
    }
  });
});

describe("ambientStartFrame", () => {
  it("follows the v7 bundle's formula, (x × 7 + y × 13) mod frames", () => {
    // 899 × 7 + 40 × 13 = 6813.
    expect(ambientStartFrame({ x: 899, y: 40 }, 4)).toBe(1);
    expect(ambientStartFrame({ x: 899, y: 40 }, 8)).toBe(5);
    expect(ambientStartFrame({ x: 0, y: 0 }, 4)).toBe(0);
    expect(ambientStartFrame({ x: 16, y: 94 }, 8)).toBe((16 * 7 + 94 * 13) % 8);
  });

  it("keeps a row of neighbouring trees from swaying in unison", () => {
    const row = Array.from({ length: 6 }, (_, index) => ({ x: 400 + index * 21, y: 300 }));
    const frames = row.map((position) =>
      ambientFrame(SWAY, 0, ambientStartFrame(position, SWAY.length), false),
    );

    expect(new Set(frames).size).toBeGreaterThan(1);
  });
});
