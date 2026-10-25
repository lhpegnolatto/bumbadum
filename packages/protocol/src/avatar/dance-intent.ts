import { type DanceId, isDance } from "@bumbadum/avatar";
import { z } from "zod";
import type { PlayerState } from "../room/room-state.ts";

/** The message a client sends to start a dance, carrying its ID, or to stop dancing, carrying `null`. */
export const DANCE_MESSAGE = "dance";

/** What a player's `dance` holds while they are not dancing. */
export const NOT_DANCING = "";

const danceIntentSchema = z.union([
  z.null(),
  z.string().refine((id): id is DanceId => isDance(id)),
]);

/** Returns the dance a dance intent asks for, `null` to stop, or `undefined` when it is not one. */
export function parseDanceIntent(input: unknown): { dance: DanceId | null } | undefined {
  const result = danceIntentSchema.safeParse(input);
  return result.success ? { dance: result.data } : undefined;
}

/** The dance a player is performing, or `null` when they are not dancing. */
export function danceOf(player: PlayerState): DanceId | null {
  return isDance(player.dance) ? player.dance : null;
}
