import { z } from "zod";

/** Client → server: enroll the current player in the Tennis line. */
export const TENNIS_JOIN_MESSAGE = "tennis-join";

/** Client → server: remove the current player from the Tennis line. */
export const TENNIS_LEAVE_MESSAGE = "tennis-leave";

/** Client → server: hold a horizontal input during a Tennis match. */
export const TENNIS_STEER_MESSAGE = "tennis-steer";

const emptyIntentSchema = z.undefined();
const tennisSteerIntentSchema = z.enum(["left", "right"]).nullable();

export type TennisSteerDirection = z.infer<typeof tennisSteerIntentSchema>;

/** Returns true for the empty join intent, or undefined for an invalid payload. */
export function parseTennisJoinIntent(input: unknown): true | undefined {
  return emptyIntentSchema.safeParse(input).success ? true : undefined;
}

/** Returns true for the empty leave intent, or undefined for an invalid payload. */
export function parseTennisLeaveIntent(input: unknown): true | undefined {
  return emptyIntentSchema.safeParse(input).success ? true : undefined;
}

/** Returns horizontal input, null to release it, or undefined for an invalid payload. */
export function parseTennisSteerIntent(input: unknown): TennisSteerDirection | undefined {
  const result = tennisSteerIntentSchema.safeParse(input);
  return result.success ? result.data : undefined;
}
