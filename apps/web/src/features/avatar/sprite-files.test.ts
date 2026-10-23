import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AVATAR_CHOICES,
  avatarFrames,
  FRAME_SIZE,
  SPRITE_SHEETS,
  WALK_FRAMES,
} from "@bumbadum/avatar";
import { describe, expect, it } from "vitest";

const PUBLIC_DIR = join(import.meta.dirname, "../../../public");

/** A PNG's width and height, read from its header. */
function pngSize(path: string): { width: number; height: number } {
  const header = readFileSync(join(PUBLIC_DIR, path)).subarray(16, 24);
  return { width: header.readUInt32BE(0), height: header.readUInt32BE(4) };
}

describe("the avatar sprite manifest", () => {
  it("names sheets that exist in public/", () => {
    for (const sheet of SPRITE_SHEETS) expect(() => pngSize(sheet)).not.toThrow();
  });

  it("finds every frame of every avatar inside its sheet", () => {
    const sizes = new Map(SPRITE_SHEETS.map((sheet) => [sheet, pngSize(sheet)]));
    const largest = {
      skinTone: AVATAR_CHOICES.skinTone,
      hair: AVATAR_CHOICES.hair,
      outfit: AVATAR_CHOICES.outfit,
    };
    for (const direction of ["up", "down", "left", "right"] as const) {
      for (let frame = 0; frame < WALK_FRAMES; frame++) {
        for (const { sheet, x, y } of avatarFrames(largest, direction, frame)) {
          const size = sizes.get(sheet);
          expect(size, sheet).toBeDefined();
          expect(x + FRAME_SIZE).toBeLessThanOrEqual(size?.width ?? 0);
          expect(y + FRAME_SIZE).toBeLessThanOrEqual(size?.height ?? 0);
        }
      }
    }
  });

  it("has exactly one row per skin tone and per hair", () => {
    expect(pngSize("/sprites/body.png").height).toBe(AVATAR_CHOICES.skinTone * FRAME_SIZE);
    expect(pngSize("/sprites/hairs.png").height).toBe(AVATAR_CHOICES.hair * FRAME_SIZE);
  });
});
