/** How many choices each layer offers, numbered from 1, as in the MetroCity pack. */
export const AVATAR_CHOICES = { skinTone: 6, hair: 8, outfit: 6 } as const;

export type AvatarLayer = keyof typeof AVATAR_CHOICES;

export const AVATAR_LAYERS = ["skinTone", "hair", "outfit"] as const satisfies AvatarLayer[];

/** A player's visual appearance. Every layer is mandatory. */
export interface Avatar {
  skinTone: number;
  hair: number;
  outfit: number;
}

function isChoice(value: unknown, layer: AvatarLayer): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= AVATAR_CHOICES[layer];
}

/** Returns the avatar with only its three layers, or `undefined` when one is missing or out of range. */
export function parseAvatar(input: unknown): Avatar | undefined {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return undefined;
  const { skinTone, hair, outfit } = input as Record<string, unknown>;
  if (!isChoice(skinTone, "skinTone") || !isChoice(hair, "hair") || !isChoice(outfit, "outfit")) {
    return undefined;
  }
  return { skinTone, hair, outfit };
}

/** The avatar a player wears until they pick one. */
export const DEFAULT_AVATAR: Avatar = { skinTone: 1, hair: 1, outfit: 1 };

/** An avatar with every layer picked by `random`, which returns a number in [0, 1) like `Math.random`. */
export function randomAvatar(random: () => number): Avatar {
  const pick = (layer: AvatarLayer) => Math.floor(random() * AVATAR_CHOICES[layer]) + 1;
  return { skinTone: pick("skinTone"), hair: pick("hair"), outfit: pick("outfit") };
}
