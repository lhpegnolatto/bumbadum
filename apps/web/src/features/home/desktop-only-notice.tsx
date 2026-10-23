"use client";

import { MonitorIcon } from "lucide-react";
import { useTranslations } from "use-intl";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";

/** Shown only on devices whose primary pointer is coarse (touch screens). */
export function DesktopOnlyNotice() {
  const t = useTranslations("home");
  return (
    <Alert className="hidden pointer-coarse:grid">
      <MonitorIcon />
      <AlertDescription>{t("desktopOnly")}</AlertDescription>
    </Alert>
  );
}
