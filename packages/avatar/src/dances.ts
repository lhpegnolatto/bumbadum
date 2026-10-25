import type { AnimationCycle, Direction } from "./sprite-manifest.ts";

/** What a dancer shows at one moment: an existing frame, nudged and optionally flipped (ADR-0021). */
export interface DanceFrame {
  cycle: AnimationCycle;
  direction: Direction;
  frame: number;
  /** Native pixels the avatar is nudged by, right and down. */
  dx: number;
  dy: number;
  /** A horizontal flip on top of the direction's own. */
  mirrored: boolean;
}

interface Dance {
  beatsPerMinute: number;
  /** How many frames each beat holds. */
  framesPerBeat: number;
  /** The frame shown still under reduced motion. */
  stillFrame: number;
  frames: readonly DanceFrame[];
}

function nudged(
  cycle: AnimationCycle,
  direction: Direction,
  frame: number,
  dx: number,
  dy: number,
): DanceFrame {
  return { cycle, direction, frame, dx, dy, mirrored: false };
}

/** Every dance, by ID. Adding a dance is adding an entry. */
const DANCES = {
  "side-step": {
    beatsPerMinute: 110,
    framesPerBeat: 2,
    stillFrame: 0,
    frames: [
      nudged("walk", "left", 1, -1, 0),
      nudged("idle", "down", 0, 0, -1),
      nudged("walk", "right", 1, 1, 0),
      nudged("idle", "down", 0, 0, -1),
    ],
  },
} as const satisfies Record<string, Dance>;

export type DanceId = keyof typeof DANCES;

export const DEFAULT_DANCE: DanceId = "side-step";

export function isDance(id: unknown): id is DanceId {
  return typeof id === "string" && Object.hasOwn(DANCES, id);
}

/**
 * The frame of `dance` at `serverTimeMs`: everyone reading the same server clock
 * shows the same frame, so dancers move in unison.
 */
export function danceFrame(
  dance: DanceId,
  serverTimeMs: number,
  reducedMotion: boolean,
): DanceFrame {
  const { beatsPerMinute, framesPerBeat, stillFrame, frames } = DANCES[dance];
  if (reducedMotion) return frames[stillFrame];
  const frameMs = 60_000 / (beatsPerMinute * framesPerBeat);
  return frames[Math.floor(serverTimeMs / frameMs) % frames.length] ?? frames[stillFrame];
}
