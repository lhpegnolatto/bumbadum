"use client";

import { SettingsIcon } from "lucide-react";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { ThemeToggle } from "@/features/theme/theme-toggle.tsx";
import { LanguageSwitcher } from "./language-switcher.tsx";

export function SettingsControl({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("settings");

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={<Button variant="secondary" size="sm" aria-label={t("title")} title={t("title")} />}
      >
        <SettingsIcon />
        {t("title")}
      </PopoverTrigger>
      <PopoverContent role="region" aria-label={t("title")} className="flex flex-col gap-4">
        <LanguageSwitcher showLabel />
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium">{t("theme")}</span>
          <ThemeToggle />
        </div>
      </PopoverContent>
    </Popover>
  );
}
