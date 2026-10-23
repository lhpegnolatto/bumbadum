import { describe, expect, it } from "vitest";
import {
  avatarFrames,
  FRAME_SIZE,
  IDLE_FRAME,
  IDLE_FRAME_MS,
  IDLE_FRAMES,
  SPRITE_SHEETS,
  WALK_FRAMES,
} from "./index.ts";

const avatar = { skinTone: 3 };

describe("avatarFrames", () => {
  it("draws a single first-party avatar frame without a shadow", () => {
    expect(avatarFrames(avatar, "down", "idle", IDLE_FRAME)).toEqual([
      { layer: "avatar", sheet: "/sprites/avatar/idle.png", x: 0, y: 48, mirrored: false },
    ]);
  });

  it("finds each direction's walking frames in its own run of 4 columns", () => {
    const bodyX = (direction: "up" | "down" | "left" | "right", frame: number) =>
      avatarFrames(avatar, direction, "walk", frame)[0]?.x;
    expect(bodyX("down", 0)).toBe(0);
    expect(bodyX("down", 3)).toBe(3 * 24);
    expect(bodyX("right", 0)).toBe(4 * 24);
    expect(bodyX("up", 1)).toBe(9 * 24);
  });

  it("draws left as the right-facing columns, mirrored", () => {
    expect(avatarFrames(avatar, "left", "walk", 2)[0]).toMatchObject({
      x: 6 * 24,
      mirrored: true,
    });
    for (const direction of ["up", "down", "right"] as const) {
      expect(avatarFrames(avatar, direction, "walk", 2)[0]?.mirrored).toBe(false);
    }
  });

  it("walks 4 frames of 24×24 pixels, standing on the first", () => {
    expect(WALK_FRAMES).toBe(4);
    expect(IDLE_FRAMES).toBe(4);
    expect(IDLE_FRAME_MS).toBe(250);
    expect(FRAME_SIZE).toBe(24);
    expect(IDLE_FRAME).toBe(0);
  });
});

describe("SPRITE_SHEETS", () => {
  it("lists every sheet an avatar can use, once each", () => {
    expect([...SPRITE_SHEETS].sort()).toEqual([
      "/sprites/avatar/idle.png",
      "/sprites/avatar/walk.png",
    ]);
  });
});
