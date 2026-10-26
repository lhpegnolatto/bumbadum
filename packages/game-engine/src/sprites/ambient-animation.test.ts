import { describe, expect, it } from "vitest";
import { ambientFrame, ambientPhase } from "../index.ts";

/** A tree's sway: four frames over 2.4 s. */
const SWAY = [600, 600, 600, 600];

describe("ambientFrame", () => {
  it("shows each frame for its duration and loops", () => {
    const at = (now: number) => ambientFrame(SWAY, now, 0, false);

    expect(at(0)).toBe(0);
    expect(at(599)).toBe(0);
    expect(at(600)).toBe(1);
    expect(at(1_800)).toBe(3);
    expect(at(2_399)).toBe(3);
    expect(at(2_400)).toBe(0);
    expect(at(9_000)).toBe(3);
  });

  it("follows each frame's own duration", () => {
    const at = (now: number) => ambientFrame([100, 300, 50], now, 0, false);

    expect(at(99)).toBe(0);
    expect(at(100)).toBe(1);
    expect(at(399)).toBe(1);
    expect(at(400)).toBe(2);
    expect(at(450)).toBe(0);
  });

  it("starts the loop a phase of the way through", () => {
    expect(ambientFrame(SWAY, 0, 0.25, false)).toBe(1);
    expect(ambientFrame(SWAY, 0, 0.9, false)).toBe(3);
    expect(ambientFrame(SWAY, 300, 0.9, false)).toBe(0);
  });

  it("holds the first frame under reduced motion", () => {
    for (const now of [0, 700, 1_300, 2_000]) {
      expect(ambientFrame(SWAY, now, 0.5, true)).toBe(0);
    }
  });
});

describe("ambientPhase", () => {
  it("is fixed for a position", () => {
    expect(ambientPhase({ x: 899, y: 40 })).toBe(ambientPhase({ x: 899, y: 40 }));
  });

  it("spreads positions over the whole loop", () => {
    const phases = Array.from({ length: 400 }, (_, index) =>
      ambientPhase({ x: (index % 20) * 16, y: Math.floor(index / 20) * 16 }),
    );

    for (const phase of phases) {
      expect(phase).toBeGreaterThanOrEqual(0);
      expect(phase).toBeLessThan(1);
    }
    for (let quarter = 0; quarter < 4; quarter++) {
      const inQuarter = phases.filter((phase) => Math.floor(phase * 4) === quarter);
      expect(inQuarter.length).toBeGreaterThan(70);
    }
  });

  it("keeps a row of neighbouring trees from swaying in unison", () => {
    const row = Array.from({ length: 6 }, (_, index) => ({ x: 400 + index * 20, y: 300 }));
    const frames = row.map((position) => ambientFrame(SWAY, 0, ambientPhase(position), false));

    expect(new Set(frames).size).toBeGreaterThan(1);
  });
});
