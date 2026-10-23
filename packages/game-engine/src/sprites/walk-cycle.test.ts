import { describe, expect, it } from "vitest";
import { WalkCycle } from "./walk-cycle.ts";

const FRAME_MS = 50;
const GRACE_MS = 40;

function cycle() {
  return new WalkCycle({ frameMs: FRAME_MS, graceMs: GRACE_MS });
}

describe("WalkCycle", () => {
  it("stands on the idle frame while the player is still", () => {
    const walk = cycle();
    expect(walk.frame(false, 0)).toBe(0);
    expect(walk.frame(false, 1000)).toBe(0);
  });

  it("starts mid-stride and steps through the 6 walking frames while moving", () => {
    const walk = cycle();
    const frames = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => walk.frame(true, 1000 + k * FRAME_MS));
    expect(frames).toEqual([1, 2, 3, 4, 5, 0, 1, 2]);
  });

  it("keeps walking through a short pause between steps", () => {
    const walk = cycle();
    walk.frame(true, 0);
    expect(walk.frame(true, FRAME_MS)).toBe(2);
    expect(walk.frame(false, FRAME_MS + GRACE_MS - 1)).toBe(2);
    expect(walk.frame(true, 2 * FRAME_MS)).toBe(3);
  });

  it("goes back to the idle frame once the pause outlasts the grace, and restarts mid-stride", () => {
    const walk = cycle();
    walk.frame(true, 0);
    walk.frame(true, 2 * FRAME_MS);
    expect(walk.frame(false, 2 * FRAME_MS + GRACE_MS)).toBe(0);
    expect(walk.frame(true, 500)).toBe(1);
  });
});
