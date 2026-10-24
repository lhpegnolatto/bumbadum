"use client";

import { ListMusicIcon, MessageCircleIcon, UsersIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";

export type RoomPanel = "chat" | "queue" | "players" | null;

const PANELS = [
  { id: "chat", icon: MessageCircleIcon },
  { id: "queue", icon: ListMusicIcon },
  { id: "players", icon: UsersIcon },
] as const;

export function RoomPanelControls({
  active,
  hasUnreadChat,
  onToggle,
}: {
  active: RoomPanel;
  hasUnreadChat: boolean;
  onToggle: (panel: Exclude<RoomPanel, null>) => void;
}) {
  const t = useTranslations("room.panels");
  return (
    <nav aria-label={t("navigation")} className="flex gap-2">
      <TooltipProvider>
        {PANELS.map(({ id, icon: Icon }) => (
          <Tooltip key={id}>
            <TooltipTrigger
              render={
                <Button
                  variant="secondary"
                  aria-label={t(id)}
                  aria-controls={`${id}-panel`}
                  aria-expanded={active === id}
                  className="compact:size-11 compact:px-0"
                  onClick={() => onToggle(id)}
                />
              }
            >
              <Icon />
              <span className="compact:sr-only">{t(id)}</span>
              {id === "chat" && hasUnreadChat ? (
                <span
                  role="status"
                  aria-label={t("newMessage")}
                  className="size-2 rounded-full bg-primary"
                />
              ) : null}
            </TooltipTrigger>
            <TooltipContent>{t(id)}</TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </nav>
  );
}

export function RoomPanelFrame({
  panel,
  open,
  children,
  onClose,
}: {
  panel: Exclude<RoomPanel, null>;
  open: boolean;
  children: ReactNode;
  onClose: () => void;
}) {
  const t = useTranslations("room.panels");
  const title = t(panel);
  return (
    <section
      id={`${panel}-panel`}
      aria-label={title}
      aria-hidden={!open}
      inert={!open}
      data-open={open}
      className="flex min-h-0 flex-1 flex-col rounded-lg border bg-background/95 p-4 shadow-lg compact:mx-3 compact:pb-24 duration-200 data-[open=false]:animate-out data-[open=false]:fade-out data-[open=false]:slide-out-to-right-2 data-[open=true]:animate-in data-[open=true]:fade-in data-[open=true]:slide-in-from-right-2 motion-reduce:animate-none motion-reduce:duration-0"
    >
      <Button
        variant="ghost"
        size="icon-sm"
        className="mb-2 self-end"
        aria-label={t("close", { panel: title })}
        onClick={onClose}
      >
        <XIcon />
      </Button>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  );
}
