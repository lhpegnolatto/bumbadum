import { type SchemaType, schema, t } from "@colyseus/schema";

/** A player's avatar: the number of each layer's choice, from 1. */
export const AvatarState = schema(
  {
    skinTone: t.uint8(),
    hair: t.uint8(),
    outfit: t.uint8(),
  },
  "AvatarState",
);
export type AvatarState = SchemaType<typeof AvatarState>;
