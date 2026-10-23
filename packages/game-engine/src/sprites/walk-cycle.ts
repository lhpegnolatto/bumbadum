import { IDLE_FRAME, WALK_FRAMES } from "@bumbadum/avatar";

export interface WalkTiming {
  /** How long each walking frame shows. */
  frameMs: number;
  /** How long the player may stand still between steps and keep walking. */
  graceMs: number;
}

/**
 * Picks an avatar's walking frame: the idle frame while still, and the walking
 * frames in turn while moving, starting mid-stride so the first step shows at once.
 */
export class WalkCycle {
  private startedAt: number | undefined;
  private lastMovingAt = Number.NEGATIVE_INFINITY;

  constructor(private readonly timing: WalkTiming) {}

  frame(moving: boolean, now: number): number {
    if (moving) {
      this.startedAt ??= now;
      this.lastMovingAt = now;
    } else if (now - this.lastMovingAt >= this.timing.graceMs) {
      this.startedAt = undefined;
    }
    if (this.startedAt === undefined) return IDLE_FRAME;
    return (1 + Math.floor((now - this.startedAt) / this.timing.frameMs)) % WALK_FRAMES;
  }
}
