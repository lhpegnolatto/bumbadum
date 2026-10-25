import type { Direction, ThrowTarget } from "@bumbadum/world";
import { z } from "zod";

/**
 * The message a client sends to throw confetti. It carries nothing: the room throws from the
 * tile and direction it holds for the player (ADR-0001).
 */
export const CONFETTI_THROW_MESSAGE = "confetti-throw";

/** Server → every client: a Confetti throw happened. It is passing, never part of the state. */
export const CONFETTI_THROWN = "confetti-thrown";

export interface ConfettiThrown {
  throwerId: string;
  direction: Direction;
  target: ThrowTarget;
}

const confettiThrowIntentSchema = z.undefined();

/** Whether a payload is a confetti throw intent. */
export function isConfettiThrowIntent(input: unknown): boolean {
  return confettiThrowIntentSchema.safeParse(input).success;
}
