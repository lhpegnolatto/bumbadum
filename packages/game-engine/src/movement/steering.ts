import type { Direction } from "@bumbadum/world";
import type { StepRepeater } from "./step-repeater.ts";

/**
 * Holds one direction at a time on `repeater`, like a single key that changes:
 * steering a new direction presses it and releases the previous one, `null`
 * releases it.
 */
export class Steering {
  private steered: Direction | null = null;

  constructor(private readonly repeater: StepRepeater) {}

  steer(direction: Direction | null, now: number): void {
    // Pressing before releasing keeps the walk's cadence; pressing again is a no-op
    // unless something released every key meanwhile.
    if (direction) this.repeater.press(direction, now);
    if (this.steered && this.steered !== direction) this.repeater.release(this.steered, now);
    this.steered = direction;
  }
}
