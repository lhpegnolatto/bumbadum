import { DIRECTIONS, type Direction } from "@bumbadum/world";
import { z } from "zod";

/**
 * The message a client sends to take one step. It carries only a direction:
 * the room applies it from the tile it holds for the player (ADR-0001).
 */
export const STEP_MESSAGE = "step";

const stepIntentSchema = z.enum(DIRECTIONS);

/** Returns the direction of a step intent, or `undefined` when the payload is not one. */
export function parseStepIntent(input: unknown): Direction | undefined {
  const result = stepIntentSchema.safeParse(input);
  return result.success ? result.data : undefined;
}
