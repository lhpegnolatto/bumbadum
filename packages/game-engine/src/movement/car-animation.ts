import type { Direction } from "@bumbadum/world";

export type CarAnimationState = "idle" | "moving" | "drifting";

export interface CarFrame {
  row: 0 | 1 | 2;
  column: 0 | 1 | 2;
  mirrored: boolean;
}

export interface CarEffectPose {
  row: 0 | 1 | 2 | 3;
  layer: "behind" | "front";
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

/** Aligns the 48×48 FX cell around the 32×32 car cell from the asset specification. */
export function carEffectPose(direction: Direction): CarEffectPose {
  const cellCentre = { x: 0, y: -14 };
  const row = direction === "down" ? 0 : direction === "right" ? 1 : direction === "up" ? 2 : 3;
  return {
    row,
    layer: direction === "up" ? "front" : "behind",
    smoke: cellCentre,
    dust: cellCentre,
    speedLines: cellCentre,
    rotation: 0,
  };
}
