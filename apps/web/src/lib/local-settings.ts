import { type Avatar, DEFAULT_AVATAR, parseAvatar } from "@bumbadum/avatar";
import { useSyncExternalStore } from "react";
import { z } from "zod";
import { type Locale, locales } from "../i18n/locale.ts";
import { SETTINGS_KEY } from "./settings-key.ts";

/**
 * Bump the version when the stored shape changes incompatibly. Adding an
 * optional field (as `avatar`, `volume` and `muted` were) keeps older settings
 * valid, so needs none.
 */
export { SETTINGS_KEY } from "./settings-key.ts";

const settingsSchema = z.object({
  nickname: z.string().optional().catch(undefined),
  locale: z.enum(locales).optional().catch(undefined),
  avatar: z
    .unknown()
    .transform((input) => {
      const avatar = parseAvatar(input);
      if (avatar) return avatar;
      return migrateLegacyAvatar(input);
    })
    .optional(),
  /** The radio's volume for this player only, 0 to 100. */
  volume: z.number().int().min(0).max(100).optional().catch(undefined),
  muted: z.boolean().optional().catch(undefined),
  theme: z.enum(["light", "dark"]).optional().catch(undefined),
});

export type Theme = "light" | "dark";

function migrateLegacyAvatar(input: unknown): Avatar | undefined {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return undefined;
  const value = input as Record<string, unknown>;
  if (!Object.keys(value).every((key) => ["skinTone", "hair", "outfit"].includes(key)))
    return undefined;
  if (!Number.isInteger(value.skinTone) || Number(value.skinTone) < 1 || Number(value.skinTone) > 6)
    return undefined;
  for (const obsolete of [value.hair, value.outfit]) {
    if (obsolete !== undefined && !Number.isInteger(obsolete)) return undefined;
  }
  return { ...DEFAULT_AVATAR, skinTone: Number(value.skinTone) <= 4 ? Number(value.skinTone) : 1 };
}

export interface Settings {
  nickname?: string;
  locale?: Locale;
  avatar?: Avatar;
  volume?: number;
  muted?: boolean;
  theme?: Theme;
}

export function parseSettings(raw: string | null): Settings {
  let json: unknown;
  try {
    json = raw === null ? {} : JSON.parse(raw);
  } catch {
    json = {};
  }
  const result = settingsSchema.safeParse(json);
  if (!result.success) return {};
  const { nickname, locale, avatar, volume, muted, theme } = result.data;
  return {
    ...(nickname !== undefined && { nickname }),
    ...(locale !== undefined && { locale }),
    ...(avatar !== undefined && { avatar }),
    ...(volume !== undefined && { volume }),
    ...(muted !== undefined && { muted }),
    ...(theme !== undefined && { theme }),
  };
}

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedSettings: Settings = {};

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(SETTINGS_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): Settings {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSettings = parseSettings(raw);
  }
  return cachedSettings;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function updateSettings(patch: Settings) {
  const next = { ...getSnapshot(), ...patch };
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (blocked, quota); the choice is then simply not kept.
  }
  for (const listener of listeners) listener();
}

/** The stored settings, or `undefined` while rendering on the server. */
export function useSettings(): Settings | undefined {
  return useSyncExternalStore(subscribe, getSnapshot, () => undefined);
}
