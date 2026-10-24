"use client";

import { commands, MESSAGE_MAX_LENGTH, suggestCommands } from "@bumbadum/chat";
import { cn } from "cn";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "use-intl";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useLocale } from "@/i18n/i18n-provider.tsx";
import { CommandHint } from "./command-help.tsx";

/**
 * The chat input, with the command hint under it and the command autocomplete
 * over it. `Enter` anywhere outside a form control focuses it, `Esc` closes
 * the autocomplete and then leaves the input, and keys typed in it never
 * reach the game.
 */
export function ChatInput({ onSend }: { onSend: (text: string) => void }) {
  const t = useTranslations("chat");
  const { locale } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  // Closed by Esc or by leaving the input; typing opens it again.
  const [dismissed, setDismissed] = useState(false);
  const listboxId = useId();
  const hintId = useId();

  const suggestions = dismissed ? [] : suggestCommands(draft, locale, commands);
  const open = suggestions.length > 0;
  const active = Math.min(highlighted, suggestions.length - 1);
  const optionId = (index: number) => `${listboxId}-${index}`;

  useEffect(() => {
    function focusChat(event: KeyboardEvent) {
      if (event.key !== "Enter" || event.defaultPrevented || isFormControl(event.target)) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    document.addEventListener("keydown", focusChat);
    return () => document.removeEventListener("keydown", focusChat);
  }, []);

  function edit(text: string) {
    setDraft(text);
    setHighlighted(0);
    setDismissed(false);
  }

  function complete(name: string) {
    edit(`/${name} `);
  }

  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.trim()) onSend(draft);
    edit("");
    inputRef.current?.blur();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    // Typing in the chat must never move the player.
    event.stopPropagation();
    const selected = suggestions[active];
    if (selected) {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlighted((active + 1) % suggestions.length);
          return;
        case "ArrowUp":
          event.preventDefault();
          setHighlighted((active - 1 + suggestions.length) % suggestions.length);
          return;
        case "Tab":
        case "Enter":
          event.preventDefault();
          complete(selected.name);
          return;
      }
    }
    if (event.key === "Escape") event.currentTarget.blur();
  }

  return (
    <form onSubmit={send} className="relative flex flex-col gap-1">
      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={t("suggestionsLabel")}
          className="absolute inset-x-0 bottom-full mb-1 rounded-lg border bg-popover p-1 text-sm text-popover-foreground shadow-md"
        >
          {suggestions.map(({ name }, index) => (
            // biome-ignore lint/a11y/useKeyWithClickEvents: the input owns the keyboard (aria-activedescendant)
            <div
              key={name}
              id={optionId(index)}
              role="option"
              // Not in the tab order: the input keeps the focus and points here.
              tabIndex={-1}
              aria-selected={index === active}
              className={cn(
                "cursor-pointer rounded-md px-2 py-1",
                index === active && "bg-accent text-accent-foreground",
              )}
              // Keep the focus in the input.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => complete(name)}
            >
              /{name}
            </div>
          ))}
        </div>
      ) : null}
      <Label htmlFor="chat-input" className="sr-only">
        {t("inputLabel")}
      </Label>
      <Input
        ref={inputRef}
        id="chat-input"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open ? optionId(active) : undefined}
        aria-describedby={hintId}
        autoComplete="off"
        maxLength={MESSAGE_MAX_LENGTH}
        placeholder={t("inputPlaceholder")}
        value={draft}
        onChange={(event) => edit(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => setDismissed(true)}
      />
      <CommandHint id={hintId} />
    </form>
  );
}

function isFormControl(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.closest("input, textarea, select, button, a") !== null)
  );
}
