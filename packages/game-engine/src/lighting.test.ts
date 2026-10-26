import { describe, expect, it } from "vitest";
import { lampIntensity, lightAlpha, lightTarget, lightThresholds } from "./index.ts";

describe("day-cycle light timing", () => {
  it("assigns deterministic thresholds spread across [0, 1)", () => {
    const sources = [
      { x: 34, y: 94 },
      { x: 210, y: 94 },
      { x: 386, y: 94 },
      { x: 562, y: 94 },
    ];
    const thresholds = lightThresholds(sources);
    expect(thresholds).toEqual(lightThresholds(sources));
    expect(thresholds).toEqual(expect.arrayContaining([0, 0.25, 0.5, 0.75]));
    expect(thresholds.every((threshold) => threshold >= 0 && threshold < 1)).toBe(true);
  });

  it("fades a source after its threshold is crossed", () => {
    expect(lightTarget(1, 0.5)).toBe(true);
    expect(lightTarget(0, 0.5)).toBe(false);
    expect(lightTarget(0, 0)).toBe(false);
    expect(lightAlpha(0, 1, 0)).toBe(0);
    expect(lightAlpha(0, 1, 90)).toBeCloseTo(0.5);
    expect(lightAlpha(0, 1, 180)).toBe(1);
    expect(lightAlpha(1, 0, 0)).toBe(1);
    expect(lightAlpha(1, 0, 90)).toBeCloseTo(0.5);
    expect(lightAlpha(1, 0, 180)).toBe(0);
  });

  it("keeps the lamp mostly steady with only occasional gentle faults", () => {
    expect(lampIntensity(0, false)).toBe(1);
    expect(lampIntensity(3, false)).toBe(1);
    expect(lampIntensity(5, false)).toBe(0.92);
    expect(lampIntensity(7, false)).toBe(0.72);
    expect(lampIntensity(6, true)).toBe(1);
  });
});
