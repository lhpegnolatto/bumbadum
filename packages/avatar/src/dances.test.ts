import { describe, expect, it } from "vitest";
import { DEFAULT_DANCE, danceFrame, isDance } from "./index.ts";

/** Two frames per beat at 110 beats per minute. */
const FRAME_MS = 60_000 / 220;

describe("the side step", () => {
  it("is the dance players get by default", () => {
    expect(DEFAULT_DANCE).toBe("side-step");
    expect(isDance("side-step")).toBe(true);
    expect(isDance("moonwalk")).toBe(false);
  });

  it("steps left, bounces, steps right and bounces, two frames a beat at 110 BPM", () => {
    const frames = [0, 1, 2, 3, 4].map((k) => danceFrame("side-step", k * FRAME_MS + 1, false));
    expect(frames).toEqual([
      { cycle: "walk", direction: "left", frame: 1, dx: -1, dy: 0, mirrored: false },
      { cycle: "idle", direction: "down", frame: 0, dx: 0, dy: -1, mirrored: false },
      { cycle: "walk", direction: "right", frame: 1, dx: 1, dy: 0, mirrored: false },
      { cycle: "idle", direction: "down", frame: 0, dx: 0, dy: -1, mirrored: false },
      frames[0],
    ]);
  });

  it("shows everyone the same frame at the same server time", () => {
    const at = 1_700_000_000_123;
    expect(danceFrame("side-step", at, false)).toEqual(danceFrame("side-step", at, false));
    expect(danceFrame("side-step", at + FRAME_MS, false)).not.toEqual(
      danceFrame("side-step", at, false),
    );
  });

  it("holds its still pose under reduced motion", () => {
    const pose = danceFrame("side-step", 0, true);
    expect([1, 2, 3].map((k) => danceFrame("side-step", k * FRAME_MS + 1, true))).toEqual([
      pose,
      pose,
      pose,
    ]);
    expect(pose).toEqual(danceFrame("side-step", 1, false));
  });
});
