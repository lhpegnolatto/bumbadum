import { danceFrame, IDLE_FRAME_MS, IDLE_FRAMES } from "@bumbadum/avatar";
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

  describe("dancing", () => {
    const SERVER_NOW = 1_700_000_000_000;
    const FRAME_MS = 60_000 / 220;
    const NOTE_FRAME_MS = (60_000 / 110) * 2;

    it("dances the player's dance in step with the server clock while standing", () => {
      const dancer = animation();
      const frames = [0, 1, 2, 3].map((k) =>
        dancer.frame(false, 5000, false, {
          dance: "side-step",
          serverNow: SERVER_NOW + k * FRAME_MS,
        }),
      );
      expect(frames).toEqual(
        [0, 1, 2, 3].map((k) => danceFrame("side-step", SERVER_NOW + k * FRAME_MS, false)),
      );
    });

    it("holds the dance's still pose under reduced motion", () => {
      const dancer = animation();
      expect(
        dancer.frame(false, 0, true, { dance: "side-step", serverNow: SERVER_NOW + FRAME_MS }),
      ).toEqual(danceFrame("side-step", 0, true));
    });

    it("walks, not dances, while the player is moving", () => {
      const dancer = animation();
      expect(dancer.frame(true, 0, false, { dance: "side-step", serverNow: SERVER_NOW })).toEqual({
        cycle: "walk",
        frame: 1,
      });
    });

    it("changes the sound-note frame every two beats from the server clock", () => {
      const dancer = animation();
      const frames = [0, 1, 2, 3, 0].map((step) =>
        dancer.soundNoteFrame(false, 0, false, {
          dance: "side-step",
          serverNow: step * NOTE_FRAME_MS,
        }),
      );
      expect(frames).toEqual([0, 1, 2, 3, 0]);
    });

    it("holds the first sound-note frame under reduced motion", () => {
      const dancer = animation();
      expect(
        dancer.soundNoteFrame(false, 0, true, {
          dance: "side-step",
          serverNow: NOTE_FRAME_MS * 3,
        }),
      ).toBe(0);
    });

    it("hides the sound-note effect while walking or without a dance", () => {
      const dancer = animation();
      expect(
        dancer.soundNoteFrame(true, 0, false, {
          dance: "side-step",
          serverNow: 0,
        }),
      ).toBeUndefined();
      expect(dancer.soundNoteFrame(false, GRACE_MS + 1, false)).toBeUndefined();
    });
  });
});
