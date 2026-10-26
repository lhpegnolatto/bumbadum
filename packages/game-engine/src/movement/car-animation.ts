import type { Direction } from "@bumbadum/world";

export type CarAnimationState = "idle" | "moving" | "drifting";

export interface CarFrame {
  row: 0 | 1 | 2;
  column: 0 | 1 | 2;
  mirrored: boolean;
}

export interface CarEffectPose {
  smoke: { x: number; y: number };
  dust: { x: number; y: number };
  speedLines: { x: number; y: number };
  rotation: number;
}

/** Maps the continuous driving state to the 3×3 car sheets supplied by the art pipeline. */
export function carFrame(
  direction: Direction,
  speed: number,
  drifting: boolean,
  now: number,
  reducedMotion = false,
): CarFrame {
  const row = direction === "up" ? 2 : direction === "down" ? 0 : 1;
  const mirrored = direction === "left";
  const state: CarAnimationState = drifting ? "drifting" : speed > 0.15 ? "moving" : "idle";
  if (state === "idle" || reducedMotion) return { row, column: 0, mirrored };
  const frameMs = speed > 5 ? 60 : 100;
  return { row, column: ((Math.floor(now / frameMs) % 2) + 1) as 1 | 2, mirrored };
}

export function fxFrame(now: number, frameCount: number, frameMs: number): number {
  if (frameCount <= 0) return 0;
  return Math.floor(Math.max(0, now) / frameMs) % frameCount;
}

/** Positions and rotates the effects behind the car's current travel direction. */
export function carEffectPose(direction: Direction): CarEffectPose {
  const vector =
    direction === "left"
      ? { x: -1, y: 0 }
      : direction === "right"
        ? { x: 1, y: 0 }
        : direction === "up"
          ? { x: 0, y: -1 }
          : { x: 0, y: 1 };
  const rear = {
    x: vector.x === 0 ? 0 : -vector.x * 19,
    y: vector.y === 0 ? 0 : -vector.y * 19,
  };
  return {
    smoke: rear,
    dust: { x: rear.x * 0.6, y: rear.y * 0.6 },
    speedLines: { x: rear.x * 0.75, y: rear.y * 0.75 },
    rotation: Math.atan2(vector.y, vector.x),
  };
}
