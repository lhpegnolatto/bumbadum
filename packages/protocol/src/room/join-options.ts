import { z } from "zod";
import { avatarSchema } from "../avatar/avatar-change.ts";
import type { JoinRejection } from "./join-rejection.ts";

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
  avatar: avatarSchema,
});

/** What a client sends when joining a room. */
export type JoinOptions = z.infer<typeof joinOptionsSchema>;

/** Returns the trimmed nickname, or `undefined` when it breaks the rules. */
export function parseNickname(input: unknown): string | undefined {
  const result = nicknameSchema.safeParse(input);
  return result.success ? result.data : undefined;
}

export type JoinOptionsResult =
  | { ok: true; options: JoinOptions }
  | { ok: false; rejection: JoinRejection };

/** Validates join options, naming what is wrong with them as a rejection code. */
export function parseJoinOptions(input: unknown): JoinOptionsResult {
  const result = joinOptionsSchema.safeParse(input);
  if (result.success) return { ok: true, options: result.data };
  const onlyAvatar = result.error.issues.every((issue) => issue.path[0] === "avatar");
  return { ok: false, rejection: onlyAvatar ? "invalid-avatar" : "invalid-nickname" };
}
