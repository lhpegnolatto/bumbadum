import { GENERATED_CATALOG } from "./catalog.generated.ts";

export const APPEARANCE_LAYERS = [
  "hair",
  "top",
  "bottom",
  "footwear",
  "overgarment",
  "neckwear",
  "eyewear",
  "headwear",
] as const;

export type AppearanceLayer = (typeof APPEARANCE_LAYERS)[number];
export type OptionalAppearanceLayer = Exclude<AppearanceLayer, "top" | "bottom">;

export interface CatalogOption {
  id: string;
  style: string;
  color: string;
}

const { hair, top, bottom, footwear, overgarment, neckwear, eyewear, headwear } = GENERATED_CATALOG;

export const AVATAR_CATALOG = {
  hair,
  top,
  bottom,
  footwear,
  overgarment,
  neckwear,
  eyewear,
  headwear,
} satisfies Readonly<Record<AppearanceLayer, readonly CatalogOption[]>>;

export const OPTIONAL_LAYERS = [
  "hair",
  "footwear",
  "overgarment",
  "neckwear",
  "eyewear",
  "headwear",
] as const satisfies readonly OptionalAppearanceLayer[];

export interface Avatar {
  skinTone: number;
  hair: string | null;
  top: string;
  bottom: string;
  footwear: string | null;
  overgarment: string | null;
  neckwear: string | null;
  eyewear: string | null;
  headwear: string | null;
}

const choiceIds = {} as Record<AppearanceLayer, ReadonlySet<string>>;
for (const layer of APPEARANCE_LAYERS) {
  choiceIds[layer] = new Set(AVATAR_CATALOG[layer].map(({ id }) => id));
}

/** The fields of something shaped like an avatar with a valid skin tone, or `undefined`. */
function avatarFields(input: unknown): Record<string, unknown> | undefined {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return undefined;
  const value = input as Record<string, unknown>;
  if (!Number.isInteger(value.skinTone) || Number(value.skinTone) < 1 || Number(value.skinTone) > 4)
    return undefined;
  return value;
}

/** Returns a complete avatar or `undefined`. */
export function parseAvatar(input: unknown): Avatar | undefined {
  const value = avatarFields(input);
  if (!value) return undefined;
  for (const layer of APPEARANCE_LAYERS) {
    const optional = OPTIONAL_LAYERS.includes(layer as OptionalAppearanceLayer);
    if (value[layer] === null && optional) continue;
    if (typeof value[layer] !== "string" || !choiceIds[layer].has(value[layer])) return undefined;
  }
  return {
    skinTone: Number(value.skinTone),
    hair: value.hair as string | null,
    top: value.top as string,
    bottom: value.bottom as string,
    footwear: value.footwear as string | null,
    overgarment: value.overgarment as string | null,
    neckwear: value.neckwear as string | null,
    eyewear: value.eyewear as string | null,
    headwear: value.headwear as string | null,
  };
}

/**
 * Returns a complete avatar from one that may wear choices no longer offered,
 * keeping every choice that still exists: an optional layer loses a removed
 * choice, a required layer takes the default avatar's.
 */
export function repairAvatar(input: unknown): Avatar | undefined {
  const value = avatarFields(input);
  if (!value) return undefined;
  const offered = (layer: AppearanceLayer) => {
    const choice = value[layer];
    return typeof choice === "string" && choiceIds[layer].has(choice) ? choice : null;
  };
  return {
    skinTone: Number(value.skinTone),
    hair: offered("hair"),
    top: offered("top") ?? DEFAULT_AVATAR.top,
    bottom: offered("bottom") ?? DEFAULT_AVATAR.bottom,
    footwear: offered("footwear"),
    overgarment: offered("overgarment"),
    neckwear: offered("neckwear"),
    eyewear: offered("eyewear"),
    headwear: offered("headwear"),
  };
}

export function sameAvatar(a: Avatar, b: Avatar): boolean {
  return a.skinTone === b.skinTone && APPEARANCE_LAYERS.every((layer) => a[layer] === b[layer]);
}

export function avatarKey(avatar: Avatar): string {
  return [avatar.skinTone, ...APPEARANCE_LAYERS.map((layer) => avatar[layer] ?? "")].join(":");
}

export const DEFAULT_AVATAR: Avatar = {
  skinTone: 1,
  hair: "short-brown",
  top: "t-shirt-blue",
  bottom: "trousers-blue",
  footwear: null,
  overgarment: null,
  neckwear: null,
  eyewear: null,
  headwear: null,
};

function pick(layer: AppearanceLayer, random: () => number): string {
  const available: readonly CatalogOption[] = AVATAR_CATALOG[layer];
  return available[Math.floor(random() * available.length)]?.id ?? available[0]?.id ?? "";
}

export function randomAvatar(random: () => number): Avatar {
  return {
    skinTone: Math.floor(random() * 4) + 1,
    hair: pick("hair", random),
    top: pick("top", random),
    bottom: pick("bottom", random),
    footwear: null,
    overgarment: null,
    neckwear: null,
    eyewear: null,
    headwear: null,
  };
}
