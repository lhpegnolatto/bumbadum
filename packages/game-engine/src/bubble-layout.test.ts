import { describe, expect, it } from "vitest";
import { placeBubble } from "./bubble-layout.ts";

const canvas = { width: 640, height: 480 };
const bubble = { width: 40, height: 20 };

describe("placeBubble", () => {
  it("centres the bubble above its anchor", () => {
    expect(placeBubble({ x: 100, y: 100 }, bubble, canvas)).toEqual({ x: 80, y: 80 });
  });

  it("keeps the bubble inside the canvas near the left and right edges", () => {
    expect(placeBubble({ x: 5, y: 100 }, bubble, canvas).x).toBe(0);
    expect(placeBubble({ x: 635, y: 100 }, bubble, canvas).x).toBe(600);
  });

  it("keeps the bubble inside the canvas near the top", () => {
    expect(placeBubble({ x: 100, y: 10 }, bubble, canvas).y).toBe(0);
  });

  it("pins a bubble wider than the canvas to its left edge", () => {
    expect(placeBubble({ x: 100, y: 100 }, { width: 700, height: 20 }, canvas).x).toBe(0);
  });
});
