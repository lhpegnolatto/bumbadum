"use client";

import { type Avatar, sameAvatar } from "@bumbadum/avatar";
import { XIcon } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import { AvatarEditor } from "./avatar-editor.tsx";

/** The avatar editor inside the room, placed by `className`. Only Apply publishes its draft. */
export function WardrobePanel({
  worn,
  open,
  onWear,
  onClose,
  className,
}: {
  worn: Avatar;
  open: boolean;
  onWear: (avatar: Avatar) => void;
  onClose: () => void;
  className?: string;
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
      aria-hidden={!open}
      inert={!open}
      data-open={open}
      tabIndex={-1}
      className={cn(
        "flex flex-col gap-4 overflow-y-auto rounded-lg border bg-background/95 p-4 shadow-lg outline-none backdrop-blur-sm duration-200 data-[open=false]:animate-out data-[open=false]:fade-out data-[open=false]:slide-out-to-left-2 data-[open=true]:animate-in data-[open=true]:fade-in data-[open=true]:slide-in-from-left-2 motion-reduce:animate-none motion-reduce:duration-0",
        className,
      )}
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
      <Button className="self-end" onClick={apply}>
        {t("apply")}
      </Button>
    </section>
  );
}
