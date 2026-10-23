import { describe, expect, it } from "vitest";
import { avatarFrames, FRAME_SIZE, IDLE_FRAME, SPRITE_SHEETS, WALK_FRAMES } from "./index.ts";

const avatar = { skinTone: 3, hair: 5, outfit: 2 };

describe("avatarFrames", () => {
  it("stacks shadow, body, outfit and hair, bottom to top", () => {
    expect(avatarFrames(avatar, "down", IDLE_FRAME).map((frame) => frame.layer)).toEqual([
      "shadow",
      "body",
      "outfit",
      "hair",
    ]);
  });

  it("takes the skin tone's row of the body sheet and the hair's row of the hair sheet", () => {
    const [, body, outfit, hair] = avatarFrames(avatar, "down", IDLE_FRAME);
    expect(body).toMatchObject({ layer: "body", sheet: "/sprites/body.png", x: 0, y: 64 });
    expect(outfit).toMatchObject({ sheet: "/sprites/outfits/outfit-2.png", x: 0, y: 0 });
    expect(hair).toMatchObject({ layer: "hair", sheet: "/sprites/hairs.png", x: 0, y: 128 });
  });

  it("finds each direction's walking frames in its own run of 6 columns", () => {
    const bodyX = (direction: "up" | "down" | "left" | "right", frame: number) =>
      avatarFrames(avatar, direction, frame)[1]?.x;
    expect(bodyX("down", 0)).toBe(0);
    expect(bodyX("down", 5)).toBe(5 * 32);
    expect(bodyX("right", 0)).toBe(6 * 32);
    expect(bodyX("up", 1)).toBe(13 * 32);
  });

  it("draws left as the right-facing columns, mirrored", () => {
    // The pack's left columns (18–23) mirror 6–11, except a few hair frames that face right.
    for (const frame of avatarFrames(avatar, "left", 2).slice(1)) {
      expect(frame).toMatchObject({ x: 8 * 32, mirrored: true });
    }
    for (const direction of ["up", "down", "right"] as const) {
      expect(avatarFrames(avatar, direction, 2)[1]?.mirrored).toBe(false);
    }
  });

  it("draws the same single shadow under every frame", () => {
    for (const frame of [0, 3, 5]) {
      expect(avatarFrames(avatar, "left", frame)[0]).toEqual({
        layer: "shadow",
        sheet: "/sprites/shadow.png",
        x: 0,
        y: 0,
        mirrored: false,
      });
    }
  });

  it("walks 6 frames of 32×32 pixels, standing on the first", () => {
    expect(WALK_FRAMES).toBe(6);
    expect(FRAME_SIZE).toBe(32);
    expect(IDLE_FRAME).toBe(0);
  });
});

describe("SPRITE_SHEETS", () => {
  it("lists every sheet an avatar can use, once each", () => {
    expect([...SPRITE_SHEETS].sort()).toEqual([
      "/sprites/body.png",
      "/sprites/hairs.png",
      "/sprites/outfits/outfit-1.png",
      "/sprites/outfits/outfit-2.png",
      "/sprites/outfits/outfit-3.png",
      "/sprites/outfits/outfit-4.png",
      "/sprites/outfits/outfit-5.png",
      "/sprites/outfits/outfit-6.png",
      "/sprites/shadow.png",
    ]);
  });
});
