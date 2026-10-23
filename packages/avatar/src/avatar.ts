/** How many choices each current appearance layer offers, numbered from 1. */
export const AVATAR_CHOICES = { skinTone: 4 } as const;

export type AvatarLayer = keyof typeof AVATAR_CHOICES;

export const AVATAR_LAYERS = ["skinTone"] as const satisfies AvatarLayer[];

/** A player's current visual appearance. */
export interface Avatar {
  skinTone: number;
}

function isChoice(value: unknown, layer: AvatarLayer): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= AVATAR_CHOICES[layer];
}

/** Returns the avatar's current appearance, or `undefined` when its skin tone is invalid. */
export function parseAvatar(input: unknown): Avatar | undefined {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return undefined;
  const { skinTone } = input as Record<string, unknown>;
  return isChoice(skinTone, "skinTone") ? { skinTone } : undefined;
}

/** The avatar a player wears until they pick one. */
export const DEFAULT_AVATAR: Avatar = { skinTone: 1 };

/** An avatar picked by `random`, which returns a number in [0, 1) like `Math.random`. */
export function randomAvatar(random: () => number): Avatar {
  return { skinTone: Math.floor(random() * AVATAR_CHOICES.skinTone) + 1 };
}
