"use client";

import { randomAvatar } from "@bumbadum/avatar";
import { LOBBY_SLUG, NICKNAME_MAX_LENGTH, parseNickname } from "@bumbadum/protocol";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { AvatarEditor } from "@/features/avatar/avatar-editor.tsx";
import { updateSettings, useSettings } from "@/lib/local-settings.ts";

export function JoinForm() {
  const t = useTranslations("home");
  const router = useRouter();
  const settings = useSettings();
  const [draft, setDraft] = useState(settings?.nickname ?? "");
  // A first visit starts from a random avatar, so friends rarely arrive looking alike.
  const [avatar, setAvatar] = useState(() => settings?.avatar ?? randomAvatar(Math.random));
  const [invalid, setInvalid] = useState(false);

  function join(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nickname = parseNickname(draft);
    if (!nickname) {
      setInvalid(true);
      return;
    }
    updateSettings({ nickname, avatar });
    router.push(`/r/${LOBBY_SLUG}`);
  }

  return (
    <form onSubmit={join} noValidate className="flex flex-col gap-8 sm:flex-row sm:items-start">
      <div className="flex flex-1 flex-col gap-3">
        <Label htmlFor="nickname">{t("nicknameLabel")}</Label>
        <Input
          id="nickname"
          name="nickname"
          autoComplete="nickname"
          maxLength={NICKNAME_MAX_LENGTH}
          placeholder={t("nicknamePlaceholder")}
          className="pointer-coarse:h-11"
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
            {t("nicknameInvalid", { max: NICKNAME_MAX_LENGTH })}
          </p>
        )}
        <Button type="submit" className="pointer-coarse:h-11">
          {t("join")}
        </Button>
      </div>
      <div className="sm:w-96">
        <AvatarEditor value={avatar} onChange={setAvatar} />
      </div>
    </form>
  );
}
