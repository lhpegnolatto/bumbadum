import { type Avatar, parseAvatar } from "@bumbadum/avatar";
import { z } from "zod";

/** An avatar sent by a client, as the avatar domain validates it. */
export const avatarSchema = z.unknown().transform((input, ctx): Avatar => {
  const avatar = parseAvatar(input);
  if (avatar) return avatar;
  ctx.addIssue({ code: "custom", message: "not a valid avatar" });
  return z.NEVER;
});

/** The message a client sends to wear another avatar. It carries the whole avatar. */
export const AVATAR_MESSAGE = "avatar";

/** Returns the avatar of an avatar change, or `undefined` when the payload is not a valid one. */
export function parseAvatarChange(input: unknown): Avatar | undefined {
  const result = avatarSchema.safeParse(input);
  return result.success ? result.data : undefined;
}
