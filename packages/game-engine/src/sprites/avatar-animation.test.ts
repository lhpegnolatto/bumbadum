import { IDLE_FRAME_MS, IDLE_FRAMES } from "@bumbadum/avatar";
import { describe, expect, it } from "vitest";
import { AvatarAnimation } from "./avatar-animation.ts";

const FRAME_MS = 50;
const GRACE_MS = 40;

function animation(sessionId = "player-one") {
  return new AvatarAnimation(sessionId, {
    walkFrameMs: FRAME_MS,
    walkGraceMs: GRACE_MS,
    idleFrameMs: IDLE_FRAME_MS,
  });
}

describe("AvatarAnimation", () => {
  it("advances the four idle frames at 4 FPS", () => {
    const idle = animation();
    const first = idle.frame(false, 0, false).frame;
    const frames = [0, 1, 2, 3, 4].map(
      (step) => idle.frame(false, step * IDLE_FRAME_MS, false).frame,
    );
    expect(frames).toEqual([
      first,
      (first + 1) % IDLE_FRAMES,
      (first + 2) % IDLE_FRAMES,
      (first + 3) % IDLE_FRAMES,
      first,
    ]);
    expect(idle.frame(false, 0, false).cycle).toBe("idle");
  });

  it("derives a stable idle phase from the player's session identity", () => {
    const first = animation("player-one").frame(false, 0, false);
    expect(animation("player-one").frame(false, 0, false)).toEqual(first);
    const phases = ["player-one", "player-two", "player-three", "player-four"].map(
      (id) => animation(id).frame(false, 0, false).frame,
    );
    expect(new Set(phases).size).toBeGreaterThan(1);
  });

  it("starts mid-stride and steps through the 4 walking frames while moving", () => {
    const walk = animation();
    const frames = [0, 1, 2, 3, 4, 5, 6, 7].map(
      (k) => walk.frame(true, 1000 + k * FRAME_MS, false).frame,
    );
    expect(frames).toEqual([1, 2, 3, 0, 1, 2, 3, 0]);
    expect(walk.frame(true, 1000, false).cycle).toBe("walk");
  });

  it("keeps walking through a short pause between steps", () => {
    const walk = animation();
    walk.frame(true, 0, false);
    expect(walk.frame(true, FRAME_MS, false).frame).toBe(2);
    expect(walk.frame(false, FRAME_MS + GRACE_MS - 1, false)).toEqual({
      cycle: "walk",
      frame: 2,
    });
    expect(walk.frame(true, 2 * FRAME_MS, false).frame).toBe(3);
  });

  it("goes back to the idle frame once the pause outlasts the grace, and restarts mid-stride", () => {
    const walk = animation();
    walk.frame(true, 0, false);
    walk.frame(true, 2 * FRAME_MS, false);
    expect(walk.frame(false, 2 * FRAME_MS + GRACE_MS, true)).toEqual({
      cycle: "idle",
      frame: 0,
    });
    expect(walk.frame(true, 500, true)).toEqual({ cycle: "walk", frame: 1 });
  });
});
