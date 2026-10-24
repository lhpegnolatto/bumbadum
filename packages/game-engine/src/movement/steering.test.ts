import type { Direction } from "@bumbadum/world";
import { describe, expect, it } from "vitest";
import { Steering } from "./steering.ts";
import { StepRepeater } from "./step-repeater.ts";

// The keyboard's timing: 6 steps/s, 200 ms before repeating.
const timing = { stepIntervalMs: 1000 / 6, repeatDelayMs: 200 };

function steering() {
  const repeater = new StepRepeater(timing);
  return { repeater, steering: new Steering(repeater) };
}

/** The steps a repeater fires when ticked at each of `times`. */
function stepsAt(repeater: StepRepeater, times: number[]): [number, Direction][] {
  return times.flatMap((now) => {
    const direction = repeater.tick(now);
    return direction ? [[now, direction] as [number, Direction]] : [];
  });
}

describe("Steering", () => {
  it("walks with the keyboard's timing while a direction is held", () => {
    const { repeater, steering: stick } = steering();
    stick.steer("down", 0);

    expect(stepsAt(repeater, [0, 199, 200, 366, 367])).toEqual([
      [0, "down"],
      [200, "down"],
      [367, "down"],
    ]);
  });

  it("stops walking on null", () => {
    const { repeater, steering: stick } = steering();
    stick.steer("up", 0);
    repeater.tick(0);
    stick.steer(null, 100);

    expect(stepsAt(repeater, [200, 400, 1000])).toEqual([]);
  });

  it("takes one Step on a tap shorter than a Step", () => {
    const { repeater, steering: stick } = steering();
    stick.steer("left", 0);
    stick.steer(null, 10);

    expect(stepsAt(repeater, [10, 200, 400])).toEqual([[10, "left"]]);
  });

  it("changes direction without breaking the cadence", () => {
    const { repeater, steering: stick } = steering();
    stick.steer("right", 0);
    stepsAt(repeater, [0, 200]);
    stick.steer("up", 250);

    expect(stepsAt(repeater, [250, 366, 367, 533, 534])).toEqual([
      [367, "up"],
      [534, "up"],
    ]);
  });

  it("ignores the same direction steered again", () => {
    const { repeater, steering: stick } = steering();
    stick.steer("down", 0);
    repeater.tick(0);
    stick.steer("down", 50);

    expect(stepsAt(repeater, [50, 199, 200])).toEqual([[200, "down"]]);
  });

  it("walks again after every key was released under it", () => {
    const { repeater, steering: stick } = steering();
    stick.steer("left", 0);
    repeater.tick(0);
    repeater.releaseAll();
    stick.steer("left", 500);

    expect(stepsAt(repeater, [500])).toEqual([[500, "left"]]);
  });
});
