"use client";

import { MESSAGE_MAX_LENGTH } from "@bumbadum/chat";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "use-intl";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";

/**
 * The chat input. `Enter` anywhere outside a form control focuses it, `Esc`
 * leaves it, and keys typed in it never reach the game.
 */
export function ChatInput({ onSend }: { onSend: (text: string) => void }) {
  const t = useTranslations("chat");
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    function focusChat(event: KeyboardEvent) {
      if (event.key !== "Enter" || event.defaultPrevented || isFormControl(event.target)) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    document.addEventListener("keydown", focusChat);
    return () => document.removeEventListener("keydown", focusChat);
  }, []);

  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.trim()) onSend(draft);
    setDraft("");
  }

  return (
    <form onSubmit={send}>
      <Label htmlFor="chat-input" className="sr-only">
        {t("inputLabel")}
      </Label>
      <Input
        ref={inputRef}
        id="chat-input"
        autoComplete="off"
        maxLength={MESSAGE_MAX_LENGTH}
        placeholder={t("inputPlaceholder")}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          // Typing in the chat must never move the player.
          event.stopPropagation();
          if (event.key === "Escape") event.currentTarget.blur();
        }}
      />
    </form>
  );
}

function isFormControl(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.closest("input, textarea, select, button, a") !== null)
  );
}
