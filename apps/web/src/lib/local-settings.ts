import { useSyncExternalStore } from "react";
import { z } from "zod";
import { type Locale, locales } from "../i18n/locale.ts";

/** Bump the version when the stored shape changes incompatibly. */
export const SETTINGS_KEY = "bumbadum:settings:v1";

const settingsSchema = z.object({
  nickname: z.string().optional().catch(undefined),
  locale: z.enum(locales).optional().catch(undefined),
});

export interface Settings {
  nickname?: string;
  locale?: Locale;
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
  const { nickname, locale } = result.data;
  return {
    ...(nickname !== undefined && { nickname }),
    ...(locale !== undefined && { locale }),
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
