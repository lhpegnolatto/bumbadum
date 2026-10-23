import { z } from "zod";

export const NICKNAME_MAX_LENGTH = 16;

const nicknameSchema = z
  .string()
  .trim()
  .min(1)
  .max(NICKNAME_MAX_LENGTH)
  .regex(/^[^\p{Cc}]*$/u);

const joinOptionsSchema = z.object({
  slug: z.string(),
  nickname: nicknameSchema,
});

/** What a client sends when joining a room. */
export type JoinOptions = z.infer<typeof joinOptionsSchema>;

/** Returns the trimmed nickname, or `undefined` when it breaks the rules. */
export function parseNickname(input: unknown): string | undefined {
  const result = nicknameSchema.safeParse(input);
  return result.success ? result.data : undefined;
}

export function parseJoinOptions(input: unknown): JoinOptions | undefined {
  const result = joinOptionsSchema.safeParse(input);
  return result.success ? result.data : undefined;
}
