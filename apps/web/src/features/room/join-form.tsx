"use client";

import { LOBBY_SLUG, NICKNAME_MAX_LENGTH, parseNickname } from "@bumbadum/protocol";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { updateSettings, useSettings } from "@/lib/local-settings.ts";

export function JoinForm() {
  const t = useTranslations("home");
  const router = useRouter();
  const storedNickname = useSettings()?.nickname ?? "";
  const [draft, setDraft] = useState(storedNickname);
  const [invalid, setInvalid] = useState(false);

  function join(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nickname = parseNickname(draft);
    if (!nickname) {
      setInvalid(true);
      return;
    }
    updateSettings({ nickname });
    router.push(`/r/${LOBBY_SLUG}`);
  }

  return (
    <form onSubmit={join} noValidate className="flex flex-col gap-3">
      <Label htmlFor="nickname">{t("nicknameLabel")}</Label>
      <Input
        id="nickname"
        name="nickname"
        autoComplete="nickname"
        maxLength={NICKNAME_MAX_LENGTH}
        placeholder={t("nicknamePlaceholder")}
        value={draft}
        aria-invalid={invalid}
        aria-describedby={invalid ? "nickname-error" : undefined}
        onChange={(event) => {
          setDraft(event.target.value);
          setInvalid(false);
        }}
      />
      {invalid && (
        <p id="nickname-error" className="text-destructive text-sm">
          {t("nicknameInvalid")}
        </p>
      )}
      <Button type="submit">{t("join")}</Button>
    </form>
  );
}
