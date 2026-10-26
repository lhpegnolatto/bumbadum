import type { Direction } from "@bumbadum/game-engine";

export type TennisSteerDirection = Extract<Direction, "left" | "right">;

/** The walkable interior of the Tennis hall in the v7 plaza, in tiles. */
export function isTennisHallPosition(x: number, y: number): boolean {
  return x >= 22 && x <= 38 && y >= 26 && y <= 43;
}

export function tennisDirectionForKey(key: string): TennisSteerDirection | null {
  if (key === "arrowleft" || key === "a") return "left";
  if (key === "arrowright" || key === "d") return "right";
  return null;
}
