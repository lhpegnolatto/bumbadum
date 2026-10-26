import type { Direction } from "@bumbadum/world";
import type { CarDriveInput } from "./car-driving.ts";

export interface CarControlIntent extends CarDriveInput {
  enter: boolean;
  dismount: boolean;
}

/**
 * Small input adapter for the future room messages. It keeps held controls separate from one-shot
 * enter/dismount actions, so a UI can bind keyboard, touch or a gamepad without knowing the wire
 * protocol that will eventually carry these intents.
 */
export class CarInput {
  private direction: Direction | null = null;
  private accelerating = false;
  private braking = false;
  private pendingEnter = false;
  private pendingDismount = false;

  steer(direction: Direction | null): void {
    this.direction = direction;
  }

  setAccelerating(accelerating: boolean): void {
    this.accelerating = accelerating;
  }

  setBraking(braking: boolean): void {
    this.braking = braking;
  }

  enter(): void {
    this.pendingEnter = true;
  }

  dismount(): void {
    this.pendingDismount = true;
  }

  /** Reads held controls and consumes one-shot actions. */
  consume(): CarControlIntent {
    const intent = {
      direction: this.direction,
      accelerating: this.accelerating,
      braking: this.braking,
      enter: this.pendingEnter,
      dismount: this.pendingDismount,
    };
    this.pendingEnter = false;
    this.pendingDismount = false;
    return intent;
  }
}
