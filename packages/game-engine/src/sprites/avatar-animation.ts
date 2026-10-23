import { IDLE_FRAMES, WALK_FRAMES } from "@bumbadum/avatar";

export interface AvatarAnimationTiming {
  idleFrameMs: number;
  walkFrameMs: number;
  walkGraceMs: number;
}

export interface AvatarAnimationFrame {
  cycle: "idle" | "walk";
  frame: number;
}

/** Selects the idle or walking artwork and its frame for one player. */
export class AvatarAnimation {
  private readonly idlePhase: number;
  private walkStartedAt: number | undefined;
  private lastWalkingAt = Number.NEGATIVE_INFINITY;

  constructor(
    sessionId: string,
    private readonly timing: AvatarAnimationTiming,
  ) {
    this.idlePhase = sessionPhase(sessionId);
  }

  frame(walking: boolean, now: number, reducedMotion: boolean): AvatarAnimationFrame {
    if (walking) {
      this.walkStartedAt ??= now;
      this.lastWalkingAt = now;
    } else if (now - this.lastWalkingAt >= this.timing.walkGraceMs) {
      this.walkStartedAt = undefined;
    }

    if (this.walkStartedAt !== undefined) {
      return {
        cycle: "walk",
        frame: (1 + Math.floor((now - this.walkStartedAt) / this.timing.walkFrameMs)) % WALK_FRAMES,
      };
    }

    return {
      cycle: "idle",
      frame: reducedMotion
        ? 0
        : (Math.floor(now / this.timing.idleFrameMs) + this.idlePhase) % IDLE_FRAMES,
    };
  }
}

function sessionPhase(sessionId: string): number {
  let hash = 0;
  for (const character of sessionId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash % IDLE_FRAMES;
}
