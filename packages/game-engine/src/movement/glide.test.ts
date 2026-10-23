import { describe, expect, it } from "vitest";
import { bumpOffset, Glide, isBumping } from "./glide.ts";

describe("Glide", () => {
  it("moves in a straight line from where it is drawn to the target over the duration", () => {
    const glide = new Glide({ x: 0, y: 0 });
    glide.to({ x: 1, y: 0 }, 1000, 100);

    expect(glide.at(1000)).toEqual({ x: 0, y: 0 });
    expect(glide.at(1050)).toEqual({ x: 0.5, y: 0 });
    expect(glide.at(1100)).toEqual({ x: 1, y: 0 });
    expect(glide.at(5000)).toEqual({ x: 1, y: 0 });
  });

  it("heads for a new target from where it is drawn, mid-glide", () => {
    const glide = new Glide({ x: 0, y: 0 });
    glide.to({ x: 2, y: 0 }, 0, 100);
    glide.to({ x: 1, y: 1 }, 50, 100);

    expect(glide.at(50)).toEqual({ x: 1, y: 0 });
    expect(glide.at(100)).toEqual({ x: 1, y: 0.5 });
    expect(glide.target).toEqual({ x: 1, y: 1 });
  });

  it("is moving only until it reaches its target", () => {
    const glide = new Glide({ x: 0, y: 0 });
    expect(glide.moving(0)).toBe(false);
    glide.to({ x: 1, y: 0 }, 1000, 100);

    expect(glide.moving(1000)).toBe(true);
    expect(glide.moving(1099)).toBe(true);
    expect(glide.moving(1100)).toBe(false);
  });

  it("jumps at once with no duration", () => {
    const glide = new Glide({ x: 0, y: 0 });
    glide.to({ x: 3, y: 4 }, 0, 0);

    expect(glide.at(0)).toEqual({ x: 3, y: 4 });
  });
});

describe("bumpOffset", () => {
  // The prototype's 5 px bump on its 32 px tiles, in tiles.
  const peak = 5 / 32;

  it("nudges towards the blocked tile and comes back", () => {
    const bump = { direction: "left", at: 0 } as const;

    expect(bumpOffset(bump, 0).x).toBeCloseTo(0);
    expect(bumpOffset(bump, 60).x).toBeCloseTo(-peak);
    expect(bumpOffset(bump, 120).x).toBeCloseTo(0);
    expect(bumpOffset(bump, 500)).toEqual({ x: 0, y: 0 });
    expect(bumpOffset({ direction: "down", at: 0 }, 60)).toEqual({ x: 0, y: peak });
  });

  it("reports a blocked-step attempt for the whole bump", () => {
    const bump = { direction: "up", at: 100 } as const;
    expect(isBumping(bump, 100)).toBe(true);
    expect(isBumping(bump, 219)).toBe(true);
    expect(isBumping(bump, 220)).toBe(false);
  });
});
