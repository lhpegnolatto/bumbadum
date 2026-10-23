"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button.tsx";
import { type Theme, updateSettings, useSettings } from "@/lib/local-settings.ts";

const darkScheme = "(prefers-color-scheme: dark)";

function subscribeToSystemTheme(listener: () => void) {
  const query = window.matchMedia(darkScheme);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function systemTheme(): Theme {
  return window.matchMedia(darkScheme).matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle() {
  const t = useTranslations("theme");
  const settings = useSettings();
  const detected = useSyncExternalStore<Theme>(subscribeToSystemTheme, systemTheme, () => "light");
  const theme = settings?.theme ?? detected;
  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = nextTheme === "dark" ? t("useDark") : t("useLight");
  const Icon = nextTheme === "dark" ? MoonIcon : SunIcon;

  useEffect(() => applyTheme(theme), [theme]);

  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      aria-label={label}
      title={label}
      onClick={() => updateSettings({ theme: nextTheme })}
    >
      <Icon />
    </Button>
  );
}
