import { z } from "zod";

export const TENNIS_EVENT = "tennis-event";
export const TENNIS_NOTICE = "tennis-notice";

const playerIdSchema = z.string().min(1);
const sideSchema = z.enum(["top", "bottom"]);
const scoreSchema = z.number().int().min(0).max(255);

const tennisEventSchema = z.discriminatedUnion("code", [
  z.object({
    code: z.literal("match-started"),
    params: z.object({ topPlayerId: playerIdSchema, bottomPlayerId: playerIdSchema }),
  }),
  z.object({
    code: z.literal("rebound"),
    params: z.object({
      playerId: playerIdSchema,
      side: sideSchema,
      reboundCount: z.number().int().nonnegative(),
    }),
  }),
  z.object({
    code: z.literal("point-scored"),
    params: z.object({ winnerId: playerIdSchema, topScore: scoreSchema, bottomScore: scoreSchema }),
  }),
  z.object({
    code: z.literal("match-complete"),
    params: z.object({ winnerId: playerIdSchema, reason: z.enum(["points", "abandonment"]) }),
  }),
]);

export type TennisEvent = z.infer<typeof tennisEventSchema>;

/** Validates a server event before a client handles its transient effect. */
export function parseTennisEvent(input: unknown): TennisEvent | undefined {
  const result = tennisEventSchema.safeParse(input);
  return result.success ? result.data : undefined;
}

const tennisNoticeSchema = z.object({
  code: z.literal("you-are-next"),
  params: z.object({ position: z.number().int().nonnegative() }),
});

export type TennisNotice = z.infer<typeof tennisNoticeSchema>;

/** Validates a private server notice for a player waiting in the line. */
export function parseTennisNotice(input: unknown): TennisNotice | undefined {
  const result = tennisNoticeSchema.safeParse(input);
  return result.success ? result.data : undefined;
}
