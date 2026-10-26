import type { Direction } from "@bumbadum/game-engine";

/** Returns the most recently pressed direction that is still held. */
export function activeCarDirection(pressed: ReadonlyMap<string, Direction>): Direction | null {
  let direction: Direction | null = null;
  for (const next of pressed.values()) direction = next;
  return direction;
}
