import { z } from "zod";
import { avatarSchema } from "../avatar/avatar-change.ts";
import type { JoinRejection } from "./join-rejection.ts";

export const NICKNAME_MAX_LENGTH = 16;
export const SLUG_MAX_LENGTH = 64;

const nicknameSchema = z
  .string()
  .trim()
  .min(1)
  .max(NICKNAME_MAX_LENGTH)
  .regex(/^[^\p{Cc}]*$/u);

/** Room slugs are kebab-case, like every route segment. */
const slugSchema = z
  .string()
  .max(SLUG_MAX_LENGTH)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const joinOptionsSchema = z.object({
  slug: slugSchema,
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
  const fields = new Set(result.error.issues.map((issue) => issue.path[0]));
  if (fields.size === 1 && fields.has("slug")) return { ok: false, rejection: "invalid-room" };
  if (fields.size === 1 && fields.has("avatar")) return { ok: false, rejection: "invalid-avatar" };
  return { ok: false, rejection: "invalid-nickname" };
}
