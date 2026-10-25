import { type Avatar, DEFAULT_AVATAR, parseAvatar, repairAvatar } from "@bumbadum/avatar";
import { type SchemaType, schema, t } from "@colyseus/schema";

/** A player's complete layered avatar. Empty strings represent optional layers not worn. */
export const AvatarState = schema(
  {
    skinTone: t.uint8(),
    hair: t.string(),
    top: t.string(),
    bottom: t.string(),
    footwear: t.string(),
    overgarment: t.string(),
    neckwear: t.string(),
    eyewear: t.string(),
    headwear: t.string(),
  },
  "AvatarState",
);
export type AvatarState = SchemaType<typeof AvatarState>;

export function avatarStateValue(avatar: Avatar) {
  return {
    ...avatar,
    hair: avatar.hair ?? "",
    footwear: avatar.footwear ?? "",
    overgarment: avatar.overgarment ?? "",
    neckwear: avatar.neckwear ?? "",
    eyewear: avatar.eyewear ?? "",
    headwear: avatar.headwear ?? "",
  };
}

export function avatarFromState(state: AvatarState): Avatar {
  const avatar = parseAvatar(avatarInput(state));
  if (!avatar) throw new Error("room contains an invalid avatar");
  return avatar;
}

/** Returns a valid avatar for rendering, tolerating old, incomplete or removed choices. */
export function avatarFromStateOrDefault(state: AvatarState): Avatar {
  return repairAvatar(avatarInput(state)) ?? DEFAULT_AVATAR;
}

function avatarInput(state: AvatarState) {
  return {
    ...state,
    hair: state.hair || null,
    footwear: state.footwear || null,
    overgarment: state.overgarment || null,
    neckwear: state.neckwear || null,
    eyewear: state.eyewear || null,
    headwear: state.headwear || null,
  };
}
