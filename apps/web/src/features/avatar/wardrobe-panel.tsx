"use client";

import { type Avatar, sameAvatar } from "@bumbadum/avatar";
import { NICKNAME_MAX_LENGTH, parseNickname } from "@bumbadum/protocol";
import { XIcon } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { cn } from "@/lib/utils.ts";
import { AvatarEditor } from "./avatar-editor.tsx";

/**
 * The avatar editor and the Nickname inside the room, placed by `className`. Only Apply publishes
 * the draft; Cancel, the close button and Escape discard it.
 */
export function WardrobePanel({
  worn,
  nickname,
  open,
  onWear,
  onRename,
  onClose,
  className,
}: {
  worn: Avatar;
  nickname: string;
  open: boolean;
  onWear: (avatar: Avatar) => void;
  onRename: (nickname: string) => void;
  onClose: () => void;
  className?: string;
}) {
  const t = useTranslations("wardrobe");
  const [draft, setDraft] = useState(worn);
  const [nicknameDraft, setNicknameDraft] = useState(nickname);
  const nextNickname = parseNickname(nicknameDraft);
  const panelRef = useRef<HTMLElement>(null);

  function apply() {
    if (!nextNickname) return;
    if (!sameAvatar(draft, worn)) onWear(draft);
    if (nextNickname !== nickname) onRename(nextNickname);
    onClose();
  }

  const closeOnEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    event.preventDefault();
    onClose();
  });

  useEffect(() => {
    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => closeOnEscape(event);
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <section
      ref={panelRef}
      role="dialog"
      aria-labelledby="wardrobe-title"
      aria-hidden={!open}
      inert={!open}
      data-open={open}
      tabIndex={-1}
      className={cn(
        "flex flex-col gap-4 overflow-y-auto rounded-lg border bg-background/95 p-4 shadow-lg outline-none backdrop-blur-sm duration-200 data-[open=false]:animate-out data-[open=false]:fade-out data-[open=false]:slide-out-to-left-2 data-[open=true]:animate-in data-[open=true]:fade-in data-[open=true]:slide-in-from-left-2 motion-reduce:animate-none motion-reduce:duration-0",
        className,
      )}
    >
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 id="wardrobe-title" className="font-heading font-semibold text-lg">
            {t("title")}
          </h2>
          <Button variant="ghost" size="icon" aria-label={t("close")} onClick={onClose}>
            <XIcon />
          </Button>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wardrobe-nickname">{t("nicknameLabel")}</Label>
          <Input
            id="wardrobe-nickname"
            autoComplete="nickname"
            maxLength={NICKNAME_MAX_LENGTH}
            className="pointer-coarse:h-11"
            value={nicknameDraft}
            aria-invalid={!nextNickname}
            aria-describedby={nextNickname ? undefined : "wardrobe-nickname-error"}
            onChange={(event) => setNicknameDraft(event.target.value)}
          />
          {!nextNickname && (
            <p id="wardrobe-nickname-error" className="text-destructive text-sm">
              {t("nicknameInvalid", { max: NICKNAME_MAX_LENGTH })}
            </p>
          )}
        </div>
      </header>
      <AvatarEditor value={draft} onChange={setDraft} />
      <footer className="mt-auto flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button disabled={!nextNickname} onClick={apply}>
          {t("apply")}
        </Button>
      </footer>
    </section>
  );
}
