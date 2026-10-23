import { describe, expect, it } from "vitest";
import { parseStepIntent } from "../index.ts";

describe("parseStepIntent", () => {
  it("returns the direction a step intent carries", () => {
    expect(parseStepIntent("up")).toBe("up");
    expect(parseStepIntent("right")).toBe("right");
  });

  it("rejects anything that is not a direction", () => {
    expect(parseStepIntent("north")).toBeUndefined();
    expect(parseStepIntent({ direction: "up" })).toBeUndefined();
    expect(parseStepIntent({ x: 3, y: 4 })).toBeUndefined();
    expect(parseStepIntent(undefined)).toBeUndefined();
  });
});
