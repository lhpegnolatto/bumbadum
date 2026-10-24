"use client";

import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button.tsx";
import { useLocale } from "@/i18n/i18n-provider.tsx";
import { locales } from "@/i18n/locale.ts";

export function LanguageSwitcher({ showLabel = false }: { showLabel?: boolean }) {
  const t = useTranslations();
  const { locale, setLocale } = useLocale();

  return (
    <fieldset className={showLabel ? "flex flex-col gap-2" : "flex items-center gap-2"}>
      <legend className={showLabel ? "mb-1 text-sm font-medium" : "sr-only"}>
        {t("settings.language")}
      </legend>
      <div className="flex items-center gap-2">
        {locales.map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={option === locale ? "secondary" : "ghost"}
            className="pointer-coarse:h-11"
            aria-pressed={option === locale}
            lang={option}
            onClick={() => setLocale(option)}
          >
            {t(`languages.${option}`)}
          </Button>
        ))}
      </div>
    </fieldset>
  );
}
