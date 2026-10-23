"use client";

import type { Avatar } from "@bumbadum/avatar";
import { XIcon } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button.tsx";
import { AvatarEditor } from "./avatar-editor.tsx";

function sameAvatar(a: Avatar, b: Avatar): boolean {
  return a.skinTone === b.skinTone;
}

const FUTURE_CATEGORIES = ["hair", "outfit", "accessories"] as const;

/** The avatar editor inside the room. Only Apply publishes its draft. */
export function WardrobePanel({
  worn,
  onWear,
  onClose,
}: {
  worn: Avatar;
  onWear: (avatar: Avatar) => void;
  onClose: () => void;
}) {
  const t = useTranslations("wardrobe");
  const [draft, setDraft] = useState(worn);
  const panelRef = useRef<HTMLElement>(null);

  function apply() {
    if (!sameAvatar(draft, worn)) onWear(draft);
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
      tabIndex={-1}
      className="absolute inset-y-0 left-0 flex w-88 flex-col gap-4 overflow-y-auto rounded-lg border bg-background p-4 shadow-lg outline-none"
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 id="wardrobe-title" className="font-heading font-semibold text-lg">
            {t("title")}
          </h2>
          <p className="text-muted-foreground text-sm">{t("hint")}</p>
        </div>
        <Button variant="ghost" size="icon" aria-label={t("close")} onClick={onClose}>
          <XIcon />
        </Button>
      </header>
      <AvatarEditor value={draft} onChange={setDraft} />
      <section aria-labelledby="future-categories-title" className="flex flex-col gap-2">
        <h3 id="future-categories-title" className="font-medium text-sm">
          {t("future.title")}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {FUTURE_CATEGORIES.map((category) => (
            <div key={category} className="rounded-md border border-dashed p-2 text-center">
              <p className="font-medium text-sm">{t(`future.${category}`)}</p>
              <p className="text-muted-foreground text-xs">{t("future.comingSoon")}</p>
            </div>
          ))}
        </div>
      </section>
      <Button onClick={apply}>{t("apply")}</Button>
    </section>
  );
}
