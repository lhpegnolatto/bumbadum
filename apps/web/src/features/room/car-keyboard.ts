import type { Direction } from "@bumbadum/game-engine";

/** Returns the most recently pressed direction that is still held. */
export function activeCarDirection(pressed: ReadonlyMap<string, Direction>): Direction | null {
  let direction: Direction | null = null;
  for (const next of pressed.values()) direction = next;
  return direction;
}

/** Returns the Q action for the current car context, or null when Q should do nothing. */
export function carActionForKey(
  key: string,
  carId: string,
  nearbyCarId: string | null,
): "enter" | "exit" | null {
  if (key.toLowerCase() !== "q") return null;
  if (carId) return "exit";
  return nearbyCarId ? "enter" : null;
}
