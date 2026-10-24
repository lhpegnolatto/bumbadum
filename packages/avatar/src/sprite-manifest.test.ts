import { describe, expect, it } from "vitest";
import { avatarFrames, DEFAULT_AVATAR, FRAME_SIZE, SPRITE_SHEETS } from "./index.ts";

describe("avatarFrames", () => {
  it("draws every worn layer in its agreed visual order", () => {
    const frames = avatarFrames(
      {
        ...DEFAULT_AVATAR,
        footwear: "boots-black",
        overgarment: "overalls-black",
        neckwear: "scarf-black",
        eyewear: "round-glasses-black",
        headwear: "cap-black",
      },
      "down",
      "idle",
      0,
    );
    expect(frames.map(({ layer }) => layer)).toEqual([
      "body",
      "bottom",
      "footwear",
      "top",
      "overgarment",
      "neckwear",
      "hair",
      "eyewear",
      "headwear",
    ]);
    expect(frames[0]).toMatchObject({ sheet: "/sprites/avatar/idle.png", x: 0, y: 0 });
    expect(frames.slice(1).every(({ sheet }) => sheet === "/sprites/avatar/layers-idle.png")).toBe(
      true,
    );
  });

  it("omits optional layers that are not worn", () => {
    expect(avatarFrames(DEFAULT_AVATAR, "down", "idle", 0).map(({ layer }) => layer)).toEqual([
      "body",
      "bottom",
      "top",
      "hair",
    ]);
  });

  it("uses the lateral columns and mirrors left", () => {
    expect(avatarFrames(DEFAULT_AVATAR, "left", "walk", 2)[0]).toMatchObject({
      x: 6 * FRAME_SIZE,
      mirrored: true,
    });
  });
});

describe("SPRITE_SHEETS", () => {
  it("preloads the body and generated layer atlases", () => {
    expect(SPRITE_SHEETS).toEqual([
      "/sprites/avatar/idle.png",
      "/sprites/avatar/walk.png",
      "/sprites/avatar/layers-idle.png",
      "/sprites/avatar/layers-walk.png",
    ]);
  });
});
