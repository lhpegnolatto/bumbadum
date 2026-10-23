import type { Direction } from "@bumbadum/world";

export interface StepTiming {
  /** Time between steps while a key is held. */
  stepIntervalMs: number;
  /** Time between the first and the second step of a held key. */
  repeatDelayMs: number;
}

/**
 * Turns held direction keys into steps over time. The newest held key wins; a
 * press steps at once, holding repeats, and a tap shorter than a step still
 * steps once, never faster than the step rate.
 */
export class StepRepeater {
  /** Held keys, oldest first. */
  private held: Direction[] = [];
  /** The direction of the next step, while walking or with a tap still to fire. */
  private direction: Direction | undefined;
  private tapPending = false;
  private stepsThisWalk = 0;
  private nextStepAt = 0;
  private lastStepAt = Number.NEGATIVE_INFINITY;

  constructor(private readonly timing: StepTiming) {}

  press(direction: Direction, now: number): void {
    if (this.held.includes(direction)) return;
    this.held.push(direction);
    this.heldChanged(now);
  }

  release(direction: Direction, now: number): void {
    const index = this.held.indexOf(direction);
    if (index < 0) return;
    this.held.splice(index, 1);
    if (index === this.held.length) this.heldChanged(now);
  }

  /** Forgets every key, including a tap still to fire. */
  releaseAll(): void {
    this.held = [];
    this.stop();
  }

  /** Returns the direction of the step due at `now`, if one is. */
  tick(now: number): Direction | undefined {
    const direction = this.direction;
    if (!direction || now < this.nextStepAt) return undefined;

    this.stepsThisWalk += 1;
    this.lastStepAt = now;
    const gap =
      this.stepsThisWalk === 1
        ? Math.max(this.timing.repeatDelayMs, this.timing.stepIntervalMs)
        : this.timing.stepIntervalMs;
    // Keeps a steady cadence, without bursting to catch up after a long frame.
    this.nextStepAt = Math.max(this.nextStepAt + gap, now + gap / 2);
    this.tapPending = false;
    if (this.held.length === 0) this.stop();
    return direction;
  }

  private heldChanged(now: number): void {
    const newest = this.held.at(-1);
    if (!newest) {
      if (!this.tapPending) this.stop();
      return;
    }
    const walking = this.direction !== undefined && this.stepsThisWalk > 0;
    this.direction = newest;
    this.tapPending = true;
    if (walking) return;
    this.stepsThisWalk = 0;
    this.nextStepAt = Math.max(now, this.lastStepAt + this.timing.stepIntervalMs);
  }

  private stop(): void {
    this.direction = undefined;
    this.tapPending = false;
    this.stepsThisWalk = 0;
  }
}
