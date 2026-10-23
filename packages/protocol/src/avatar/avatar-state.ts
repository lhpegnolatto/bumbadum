import { type SchemaType, schema, t } from "@colyseus/schema";

/** A player's avatar: its selected skin tone, numbered from 1. */
export const AvatarState = schema(
  {
    skinTone: t.uint8(),
  },
  "AvatarState",
);
export type AvatarState = SchemaType<typeof AvatarState>;
