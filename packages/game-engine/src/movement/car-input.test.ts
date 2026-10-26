import { describe, expect, it } from "vitest";
import { CarInput } from "./car-input.ts";

describe("CarInput", () => {
  it("keeps steering and throttle held while consuming enter and dismount once", () => {
    const input = new CarInput();
    input.steer("right");
    input.setAccelerating(true);
    input.enter();
    input.dismount();

    expect(input.consume()).toEqual({
      direction: "right",
      accelerating: true,
      braking: false,
      enter: true,
      dismount: true,
    });
    expect(input.consume()).toEqual({
      direction: "right",
      accelerating: true,
      braking: false,
      enter: false,
      dismount: false,
    });
  });
});
