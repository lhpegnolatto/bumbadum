import type { CarPoint, CarVelocity } from "./car-driving.ts";

/** How long a Car keeps moving on its last known velocity without a newer state. */
const MAX_CARRY_MS = 100;

/** How long the difference between where a Car was drawn and a newer state takes to fade. */
const CORRECTION_MS = 100;

/** A newer state further than this from where the Car is drawn is a jump, such as a respawn. */
const JUMP_PX = 64;

/**
 * Where a Car is drawn, in world pixels, between the room's states: its last known position
 * carried on at its last known velocity, so it moves every frame rather than at the patch rate.
 */
export class CarGlide {
  private position: CarPoint;
  private velocity: CarVelocity;
  private receivedAt: number;
  /** Where the Car was drawn minus where the newest state put it, when that state arrived. */
  private correction: CarPoint = { x: 0, y: 0 };

  constructor(position: CarPoint, velocity: CarVelocity, now: number) {
    this.position = { ...position };
    this.velocity = { ...velocity };
    this.receivedAt = now;
  }

  /** Takes the room's newest state for the Car, easing out any difference from where it is drawn. */
  update(position: CarPoint, velocity: CarVelocity, now: number): void {
    if (samePoint(position, this.position) && samePoint(velocity, this.velocity)) return;
    const drawn = this.at(now);
    const correction = { x: drawn.x - position.x, y: drawn.y - position.y };
    this.position = { ...position };
    this.velocity = { ...velocity };
    this.receivedAt = now;
    this.correction =
      Math.hypot(correction.x, correction.y) > JUMP_PX ? { x: 0, y: 0 } : correction;
  }

  at(now: number): CarPoint {
    const elapsed = Math.max(now - this.receivedAt, 0);
    const seconds = Math.min(elapsed, MAX_CARRY_MS) / 1000;
    const remaining = Math.max(1 - elapsed / CORRECTION_MS, 0);
    return {
      x: this.position.x + this.velocity.x * seconds + this.correction.x * remaining,
      y: this.position.y + this.velocity.y * seconds + this.correction.y * remaining,
    };
  }
}

function samePoint(a: CarPoint | CarVelocity, b: CarPoint | CarVelocity): boolean {
  return a.x === b.x && a.y === b.y;
}
