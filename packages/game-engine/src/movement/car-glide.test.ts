import { describe, expect, it } from "vitest";
import { CarGlide } from "./car-glide.ts";

describe("CarGlide", () => {
  it("carries the Car on at its last known velocity between the room's states", () => {
    const glide = new CarGlide({ x: 100, y: 50 }, { x: 180, y: 0 }, 1000);

    expect(glide.at(1000)).toEqual({ x: 100, y: 50 });
    expect(glide.at(1025)).toEqual({ x: 104.5, y: 50 });
    expect(glide.at(1050)).toEqual({ x: 109, y: 50 });
  });

  it("stops carrying the Car on once the room's states stop arriving", () => {
    const glide = new CarGlide({ x: 100, y: 50 }, { x: 0, y: -180 }, 1000);

    // 100 ms at 180 px/s, then no further.
    expect(glide.at(1100)).toEqual({ x: 100, y: 32 });
    expect(glide.at(2000)).toEqual({ x: 100, y: 32 });
  });

  it("goes on seamlessly from a new state that agrees with where it was drawn", () => {
    const glide = new CarGlide({ x: 100, y: 50 }, { x: 180, y: 0 }, 1000);
    glide.update({ x: 109, y: 50 }, { x: 180, y: 0 }, 1050);

    expect(glide.at(1050)).toEqual({ x: 109, y: 50 });
    expect(glide.at(1075)).toEqual({ x: 113.5, y: 50 });
  });

  it("eases out the difference to a new state that disagrees, instead of jumping", () => {
    const glide = new CarGlide({ x: 100, y: 50 }, { x: 180, y: 0 }, 1000);
    // Drawn at x = 109 when the room says the Car hit a wall at x = 105.
    glide.update({ x: 105, y: 50 }, { x: 0, y: 0 }, 1050);

    expect(glide.at(1050)).toEqual({ x: 109, y: 50 });
    expect(glide.at(1100)).toEqual({ x: 107, y: 50 });
    expect(glide.at(1150)).toEqual({ x: 105, y: 50 });
  });

  it("ignores a repeated state, which says nothing new about the Car", () => {
    const glide = new CarGlide({ x: 100, y: 50 }, { x: 180, y: 0 }, 1000);
    glide.update({ x: 100, y: 50 }, { x: 180, y: 0 }, 1050);

    expect(glide.at(1075)).toEqual({ x: 113.5, y: 50 });
  });

  it("jumps straight to a state far from where it was drawn, such as a respawn", () => {
    const glide = new CarGlide({ x: 100, y: 50 }, { x: 180, y: 0 }, 1000);
    glide.update({ x: 500, y: 300 }, { x: 0, y: 0 }, 1050);

    expect(glide.at(1050)).toEqual({ x: 500, y: 300 });
  });
});
