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

  it("completes the eight-beat passinho before starting the giro", () => {
    const frames = [0, 1, 2, 3, 4].map((k) => danceFrame("side-step", k * FRAME_MS + 1, false));
    expect(frames).toEqual([
      { cycle: "walk", direction: "left", frame: 1, dx: -1, dy: 0, mirrored: false },
      { cycle: "idle", direction: "down", frame: 0, dx: 0, dy: -1, mirrored: false },
      { cycle: "walk", direction: "right", frame: 1, dx: 1, dy: 0, mirrored: false },
      { cycle: "idle", direction: "down", frame: 0, dx: 0, dy: -1, mirrored: false },
      frames[0],
    ]);

    expect(
      Array.from({ length: 16 }, (_, frame) =>
        danceFrame("side-step", frame * FRAME_MS + 1, false),
      ).map(({ direction }) => direction),
    ).toEqual([
      "left",
      "down",
      "right",
      "down",
      "left",
      "down",
      "right",
      "down",
      "left",
      "down",
      "right",
      "down",
      "left",
      "down",
      "right",
      "down",
    ]);
  });

  it("follows the giro with left, up, right, and down for eight beats", () => {
    const giro = Array.from({ length: 16 }, (_, frame) =>
      danceFrame("side-step", (16 + frame) * FRAME_MS + 1, false),
    );

    expect(giro.map(({ direction }) => direction)).toEqual([
      "left",
      "left",
      "left",
      "left",
      "up",
      "up",
      "up",
      "up",
      "right",
      "right",
      "right",
      "right",
      "down",
      "down",
      "down",
      "down",
    ]);
    expect(giro.map(({ cycle, frame }) => [cycle, frame])).toEqual([
      ["walk", 1],
      ["walk", 2],
      ["walk", 3],
      ["walk", 0],
      ["walk", 1],
      ["walk", 2],
      ["walk", 3],
      ["walk", 0],
      ["walk", 1],
      ["walk", 2],
      ["walk", 3],
      ["walk", 0],
      ["walk", 1],
      ["walk", 2],
      ["walk", 3],
      ["walk", 0],
    ]);

    expect(danceFrame("side-step", 32 * FRAME_MS + 1, false)).toEqual(
      danceFrame("side-step", 0, false),
    );
  });

  it("shows everyone the same frame at the same server time", () => {
    const at = 1;
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
