import { type GameMap, isWalkable, type Tile } from "./map.ts";

export const DIRECTIONS = ["up", "down", "left", "right"] as const;

/** Where a player is facing. */
export type Direction = (typeof DIRECTIONS)[number];

export function isDirection(value: unknown): value is Direction {
  return DIRECTIONS.includes(value as Direction);
}

/** How many steps a player takes per second while walking. */
export const STEPS_PER_SECOND = 6;

/** One tile's move in each direction. */
export const OFFSETS: Readonly<Record<Direction, Tile>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export interface StepResult {
  /** The tile the player ends on: the next one, or the same one when that is blocked. */
  tile: Tile;
  moved: boolean;
}

/**
 * One step from `from` towards `direction`. Towards a blocked tile the player
 * stays put and only turns to face `direction`.
 */
export function step(map: GameMap, from: Tile, direction: Direction): StepResult {
  const offset = OFFSETS[direction];
  const ahead = { x: from.x + offset.x, y: from.y + offset.y };
  return isWalkable(map, ahead) ? { tile: ahead, moved: true } : { tile: from, moved: false };
}
