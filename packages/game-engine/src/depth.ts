import { TILE_SIZE } from "./camera.ts";
import type { Point } from "./movement/glide.ts";

/**
 * Objects sort half a world pixel above their base, so a player whose feet are level with an
 * object's base draws in front of it.
 */
const OBJECT_TIE_BREAK = 0.5;

/**
 * Players and objects share one depth order, by the world y of their bottom edge: the higher
 * the key, the further in front. A player drawn at `at` (in tiles, between tiles while gliding)
 * stands with their feet on the tile's bottom edge.
 */
export function playerDepth(at: Point): number {
  return (at.y + 1) * TILE_SIZE;
}

/** Cars use the same feet/anchor convention as avatars, so they share the room's depth order. */
export function carDepth(at: Point): number {
  return playerDepth(at);
}

/** The depth key of a placed object, from its sprite's bottom edge in world pixels. */
export function objectDepth(object: { base: number }): number {
  return object.base - OBJECT_TIE_BREAK;
}
