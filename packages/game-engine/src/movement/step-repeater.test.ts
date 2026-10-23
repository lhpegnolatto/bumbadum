import type { Direction } from "@bumbadum/world";
import { describe, expect, it } from "vitest";
import { StepRepeater } from "./step-repeater.ts";

// The values chosen in the movement prototype: 6 steps/s, 200 ms before repeating.
const timing = { stepIntervalMs: 1000 / 6, repeatDelayMs: 200 };

/** The steps a repeater fires when ticked at each of `times`. */
function stepsAt(repeater: StepRepeater, times: number[]): [number, Direction][] {
  return times.flatMap((now) => {
    const direction = repeater.tick(now);
    return direction ? [[now, direction] as [number, Direction]] : [];
  });
}

describe("StepRepeater", () => {
  it("steps at once on a press", () => {
    const repeater = new StepRepeater(timing);
    repeater.press("left", 1000);

    expect(repeater.tick(1000)).toBe("left");
    expect(repeater.tick(1001)).toBeUndefined();
  });

  it("keeps walking while held: a second step after 200 ms, then 6 steps per second", () => {
    const repeater = new StepRepeater(timing);
    repeater.press("down", 0);

    expect(stepsAt(repeater, [0, 199, 200, 366, 367, 533, 534])).toEqual([
      [0, "down"],
      [200, "down"],
      [367, "down"],
      [534, "down"],
    ]);
  });

  it("stops walking on release", () => {
    const repeater = new StepRepeater(timing);
    repeater.press("up", 0);
    repeater.tick(0);
    repeater.release("up", 100);

    expect(stepsAt(repeater, [200, 400, 1000])).toEqual([]);
  });

  it("never steps faster than the step rate when tapping, and never drops a tap", () => {
    const repeater = new StepRepeater(timing);
    repeater.press("right", 0);
    repeater.tick(0);
    repeater.release("right", 40);
    repeater.press("right", 80);
    repeater.release("right", 120);

    expect(stepsAt(repeater, [120, 166, 167, 400])).toEqual([[167, "right"]]);
  });

  it("switches direction without breaking the cadence while walking", () => {
    const repeater = new StepRepeater(timing);
    repeater.press("right", 0);
    stepsAt(repeater, [0, 200]);
    repeater.press("up", 250);

    expect(stepsAt(repeater, [250, 366, 367])).toEqual([[367, "up"]]);
  });

  it("walks on in the key still held when the newer one is released", () => {
    const repeater = new StepRepeater(timing);
    repeater.press("right", 0);
    repeater.press("down", 10);
    stepsAt(repeater, [10, 210]);
    repeater.release("down", 250);

    expect(stepsAt(repeater, [377])).toEqual([[377, "right"]]);
  });

  it("forgets every key on releaseAll, such as when the chat takes the keyboard", () => {
    const repeater = new StepRepeater(timing);
    repeater.press("left", 0);
    repeater.press("up", 10);
    repeater.releaseAll();

    expect(stepsAt(repeater, [10, 500])).toEqual([]);
  });
});
