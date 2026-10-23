export const locales = ["pt-BR", "en"] as const;
export type Locale = (typeof locales)[number];

/** First visit: a `pt*` preferred browser language gets pt-BR, anything else English. */
export function detectLocale(browserLanguages: readonly string[]): Locale {
  return browserLanguages[0]?.toLowerCase().startsWith("pt") ? "pt-BR" : "en";
}
