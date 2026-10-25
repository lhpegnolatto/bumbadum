import {
  type DanceFrame,
  type DanceId,
  danceFrame,
  IDLE_FRAMES,
  WALK_FRAMES,
} from "@bumbadum/avatar";

export interface AvatarAnimationTiming {
  idleFrameMs: number;
  walkFrameMs: number;
  walkGraceMs: number;
}

/** An idle or walking frame, facing the player's direction; a dance frame names its own. */
export type AvatarAnimationFrame = { cycle: "idle" | "walk"; frame: number } | DanceFrame;

/** The dance a standing player is performing, and the server's time to keep it in step. */
export interface Dancing {
  dance: DanceId;
  serverNow: number;
}

/** Selects the idle, walking or dancing artwork and its frame for one player. */
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

  frame(
    walking: boolean,
    now: number,
    reducedMotion: boolean,
    dancing?: Dancing,
  ): AvatarAnimationFrame {
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

    if (dancing) return danceFrame(dancing.dance, dancing.serverNow, reducedMotion);

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
