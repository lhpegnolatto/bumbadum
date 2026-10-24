import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AVATAR_CATALOG,
  avatarFrames,
  DEFAULT_AVATAR,
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
      ...DEFAULT_AVATAR,
      skinTone: 4,
      footwear: AVATAR_CATALOG.footwear.at(-1)?.id ?? null,
      overgarment: AVATAR_CATALOG.overgarment.at(-1)?.id ?? null,
      neckwear: AVATAR_CATALOG.neckwear.at(-1)?.id ?? null,
      eyewear: AVATAR_CATALOG.eyewear.at(-1)?.id ?? null,
      headwear: AVATAR_CATALOG.headwear.at(-1)?.id ?? null,
    };
    for (const direction of ["up", "down", "left", "right"] as const) {
      for (let frame = 0; frame < WALK_FRAMES; frame++) {
        for (const { sheet, x, y } of avatarFrames(largest, direction, "walk", frame)) {
          const size = sizes.get(sheet);
          expect(size, sheet).toBeDefined();
          expect(x + FRAME_SIZE).toBeLessThanOrEqual(size?.width ?? 0);
          expect(y + FRAME_SIZE).toBeLessThanOrEqual(size?.height ?? 0);
        }
      }
    }
  });

  it("keeps every runtime texture within the WebGL guaranteed maximum size", () => {
    expect(pngSize("/sprites/avatar/idle.png").height).toBe(4 * FRAME_SIZE);
    expect(pngSize("/sprites/avatar/walk.png").height).toBe(4 * FRAME_SIZE);
    for (const sheet of SPRITE_SHEETS) {
      expect(pngSize(sheet).width).toBeLessThanOrEqual(4096);
      expect(pngSize(sheet).height).toBeLessThanOrEqual(4096);
    }
  });
});
