"use client";

import { createContext, use, useEffect } from "react";
import { IntlProvider } from "use-intl";
import { updateSettings, useSettings } from "@/lib/local-settings.ts";
import { detectLocale, type Locale } from "./locale.ts";
import { messages } from "./messages.ts";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function setLocale(locale: Locale) {
  updateSettings({ locale });
}

/**
 * The language lives in localStorage, not in the URL (ADR-0009), so it is only
 * known in the browser: nothing renders until then.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const settings = useSettings();
  const locale = settings && (settings.locale ?? detectLocale(navigator.languages));

  useEffect(() => {
    if (locale) document.documentElement.lang = locale;
  }, [locale]);

  if (!locale) return null;

  return (
    <LocaleContext value={{ locale, setLocale }}>
      <IntlProvider locale={locale} messages={messages[locale]}>
        {children}
      </IntlProvider>
    </LocaleContext>
  );
}

export function useLocale(): LocaleContextValue {
  const value = use(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside I18nProvider");
  return value;
}
