import type { Direction, ThrowTarget } from "@bumbadum/world";
import { TILE_SIZE } from "../camera.ts";

/** How long the hand holds the confetti, then winds up, before letting go. */
const HAND_FRAME_MS = [120, 110] as const;
/** The four frames of the burst where the confetti lands. */
const IMPACT_FRAME_MS = [70, 90, 110, 140] as const;
/** Under reduced motion, one burst frame alone, held still. */
const STILL_IMPACT_FRAME = 2;
const STILL_IMPACT_MS = 600;
const PROJECTILE_FRAME_MS = 60;
/** About 105 ms a tile, so the throw's full reach takes about a third of a second. */
const FLIGHT_MS_PER_PIXEL = 105 / 16;
const MIN_FLIGHT_MS = 70;
/** About 13 px high over two tiles, as the supplied throw was drawn. */
const ARC_HEIGHT_PER_PIXEL = 13 / 32;
const PROJECTILE_FRAMES = 4;
/** How far above a Player's feet the confetti bursts, as the supplied impact was drawn. */
const CHEST_HEIGHT = 12;
/** Where the confetti leaves the hand as it winds up, from the thrower's feet. */
const HAND_OFFSETS: Record<Direction, PixelPoint> = {
  down: { x: -8, y: -6 },
  left: { x: -1, y: -6 },
  right: { x: 1, y: -6 },
  up: { x: 7, y: -3 },
};

/** What a Confetti throw shows at one moment. */
export type ConfettiThrowFrame =
  | { phase: "hand"; frame: number }
  /** `progress` runs from 0, leaving the hand, to 1, landing; `frame` spins the confetti. */
  | { phase: "flight"; progress: number; frame: number }
  | { phase: "impact"; frame: number }
  | { phase: "done" };

/** What a Confetti throw whose flight lasts `flightMs` shows `elapsed` ms after it started. */
export function confettiThrowFrame(
  elapsed: number,
  flightMs: number,
  reducedMotion: boolean,
): ConfettiThrowFrame {
  if (reducedMotion) {
    return elapsed < STILL_IMPACT_MS
      ? { phase: "impact", frame: STILL_IMPACT_FRAME }
      : { phase: "done" };
  }
  let left = elapsed;
  for (const [frame, ms] of HAND_FRAME_MS.entries()) {
    if (left < ms) return { phase: "hand", frame };
    left -= ms;
  }
  if (left < flightMs) {
    return {
      phase: "flight",
      progress: left / flightMs,
      frame: Math.floor(left / PROJECTILE_FRAME_MS) % PROJECTILE_FRAMES,
    };
  }
  left -= flightMs;
  for (const [frame, ms] of IMPACT_FRAME_MS.entries()) {
    if (left < ms) return { phase: "impact", frame };
    left -= ms;
  }
  return { phase: "done" };
}

/** A point in world pixels. */
export interface PixelPoint {
  x: number;
  y: number;
}

/** Where the confetti flies in world pixels, and how its sprite turns to face the way it goes. */
export interface FlightPoint {
  x: number;
  y: number;
  rotation: number;
  /** Flipped flying left, so the trail behind it never turns upside down. */
  mirrored: boolean;
}

/** How long confetti takes to fly `distance` world pixels. */
export function flightMs(distance: number): number {
  return Math.max(MIN_FLIGHT_MS, distance * FLIGHT_MS_PER_PIXEL);
}

/** Where confetti flying from `from` to `to`, in world pixels, is at `progress`, in an arc. */
export function flightPoint(from: PixelPoint, to: PixelPoint, progress: number): FlightPoint {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const height = Math.hypot(dx, dy) * ARC_HEIGHT_PER_PIXEL;
  // The heading follows the arc: the slope of y = lerp - height × sin(π × progress).
  const vy = dy - height * Math.PI * Math.cos(Math.PI * progress);
  const mirrored = dx < 0;
  return {
    x: from.x + dx * progress,
    y: from.y + dy * progress - height * Math.sin(Math.PI * progress),
    // The art flies right; flipped, it flies left, and turns the other way.
    rotation: mirrored ? Math.atan2(-vy, -dx) : Math.atan2(vy, dx),
    mirrored,
  };
}

/** Where the confetti leaves the hand of a thrower whose feet are at `feet`, in world pixels. */
export function handPoint(feet: PixelPoint, direction: Direction): PixelPoint {
  const offset = HAND_OFFSETS[direction];
  return { x: feet.x + offset.x, y: feet.y + offset.y };
}

/** Where the confetti bursts, in world pixels. */
export function landingPoint({ at, onPlayer }: ThrowTarget): PixelPoint {
  const x = (at.x + 0.5) * TILE_SIZE;
  const feet = (at.y + 1) * TILE_SIZE;
  return { x, y: onPlayer ? feet - CHEST_HEIGHT : (at.y + 0.5) * TILE_SIZE };
}
