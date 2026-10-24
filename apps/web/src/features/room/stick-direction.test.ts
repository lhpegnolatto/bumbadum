import { describe, expect, it } from "vitest";
import { stickDirection } from "./stick-direction.ts";

describe("stickDirection", () => {
  it("steers nowhere while the thumb stays in the dead zone around the centre", () => {
    expect(stickDirection({ x: 0, y: 0 }, null)).toBeNull();
    expect(stickDirection({ x: 0.2, y: -0.15 }, null)).toBeNull();
    // Back in the dead zone stops a walk.
    expect(stickDirection({ x: 0.1, y: 0 }, "right")).toBeNull();
  });

  it("steers along each axis, up being towards the top of the screen", () => {
    expect(stickDirection({ x: 0, y: -0.6 }, null)).toBe("up");
    expect(stickDirection({ x: 0, y: 0.6 }, null)).toBe("down");
    expect(stickDirection({ x: -0.6, y: 0 }, null)).toBe("left");
    expect(stickDirection({ x: 0.6, y: 0 }, null)).toBe("right");
  });

  it("follows the dominant axis off the axes", () => {
    expect(stickDirection({ x: 0.5, y: -0.3 }, null)).toBe("right");
    expect(stickDirection({ x: -0.2, y: 0.7 }, null)).toBe("down");
  });

  it("counts a thumb past the rim like one on it", () => {
    expect(stickDirection({ x: -4, y: 1 }, null)).toBe("left");
  });

  it("keeps the current direction near a diagonal", () => {
    // Slightly past the diagonal, towards the other axis.
    expect(stickDirection({ x: 0.5, y: -0.55 }, "right")).toBe("right");
    expect(stickDirection({ x: 0.55, y: -0.5 }, "up")).toBe("up");
    // Without a current direction, the dominant axis wins.
    expect(stickDirection({ x: 0.5, y: -0.55 }, null)).toBe("up");
  });

  it("switches axis once the other one clearly wins", () => {
    expect(stickDirection({ x: 0.4, y: -0.6 }, "right")).toBe("up");
    expect(stickDirection({ x: 0.6, y: -0.4 }, "up")).toBe("right");
  });

  it("turns around on the same axis at once", () => {
    expect(stickDirection({ x: -0.5, y: 0.45 }, "right")).toBe("left");
    expect(stickDirection({ x: 0.45, y: 0.5 }, "up")).toBe("down");
  });
});
