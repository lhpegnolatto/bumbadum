"use client";

import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button.tsx";
import { useLocale } from "@/i18n/i18n-provider.tsx";
import { locales } from "@/i18n/locale.ts";

export function LanguageSwitcher() {
  const t = useTranslations();
  const { locale, setLocale } = useLocale();

  return (
    <fieldset className="flex items-center gap-2">
      <legend className="sr-only">{t("home.languageLabel")}</legend>
      {locales.map((option) => (
        <Button
          key={option}
          type="button"
          size="sm"
          variant={option === locale ? "secondary" : "ghost"}
          aria-pressed={option === locale}
          lang={option}
          onClick={() => setLocale(option)}
        >
          {t(`languages.${option}`)}
        </Button>
      ))}
    </fieldset>
  );
}
