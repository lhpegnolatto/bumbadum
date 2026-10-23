"use client";

import { useTranslations } from "use-intl";

export function HomeTagline() {
  const t = useTranslations("home");
  return <p className="text-muted-foreground">{t("tagline")}</p>;
}
