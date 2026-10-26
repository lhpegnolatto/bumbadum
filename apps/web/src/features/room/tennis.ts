import type { Direction } from "@bumbadum/game-engine";

export type TennisSteerDirection = Extract<Direction, "left" | "right">;

/** The walkable interior of the Tennis hall in the plaza-v2 map, in tiles. */
export function isTennisHallPosition(x: number, y: number): boolean {
  return x >= 22 && x <= 38 && y >= 20 && y <= 37;
}

export function tennisDirectionForKey(key: string): TennisSteerDirection | null {
  if (key === "arrowleft" || key === "a") return "left";
  if (key === "arrowright" || key === "d") return "right";
  return null;
}
