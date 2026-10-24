"use client";

import type { RoomState } from "@bumbadum/protocol";
import type { Room } from "@colyseus/sdk";
import { ListMusicIcon, MessageCircleIcon, UsersIcon, XIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import { ChatComposer } from "@/features/chat/chat-panel.tsx";

export type RoomPanel = "chat" | "queue" | "players" | null;

/**
 * How an open panel or the Wardrobe looks as the compact layout's sheet: opaque and edge to edge
 * down to the bottom, clear of the safe area. Each caller places it below the Radio strip.
 */
export const COMPACT_SHEET =
  "compact:rounded-none compact:border-0 compact:bg-background compact:px-3 compact:pt-2 compact:pb-[var(--room-safe-bottom)] compact:shadow-none";

const PANELS = [
  { id: "chat", icon: MessageCircleIcon },
  { id: "queue", icon: ListMusicIcon },
  { id: "players", icon: UsersIcon },
] as const;

function isRoomPanel(value: unknown): value is Exclude<RoomPanel, null> {
  return PANELS.some(({ id }) => id === value);
}

/**
 * One button per panel on desktop. The compact layout keeps only Chat, which opens the sheet whose
 * tabs reach the other panels (ADR-0018).
 */
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
                  className={`relative compact:size-11 compact:px-0 ${id === "chat" ? "" : "compact:hidden"}`}
                  onClick={() => onToggle(id)}
                />
              }
            >
              <Icon />
              <span className="compact:sr-only">{t(id)}</span>
              {id === "chat" && hasUnreadChat ? (
                // A badge on the icon-only compact button.
                <UnreadChat className="compact:absolute compact:top-1.5 compact:right-1.5 compact:size-2.5" />
              ) : null}
            </TooltipTrigger>
            <TooltipContent>{t(id)}</TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </nav>
  );
}

/** A dot announced by name, so the signal is its presence rather than its colour. */
function UnreadChat({ className = "" }: { className?: string }) {
  const t = useTranslations("room.panels");
  return (
    <span
      role="status"
      aria-label={t("newMessage")}
      className={`size-2 rounded-full bg-primary ring-2 ring-background ${className}`}
    />
  );
}

/**
 * The open panel. On desktop it sits under the Screen; in the compact layout it is the sheet below
 * the Radio strip, whose tabs switch between the same panels, so either layout keeps it open.
 */
export function RoomPanelFrame({
  panel,
  open,
  hasUnreadChat,
  children,
  onSelect,
  onClose,
}: {
  panel: Exclude<RoomPanel, null>;
  open: boolean;
  hasUnreadChat: boolean;
  children: ReactNode;
  onSelect: (panel: Exclude<RoomPanel, null>) => void;
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
      className={`flex min-h-0 flex-1 flex-col rounded-lg border bg-background/95 p-4 shadow-lg duration-200 data-[open=false]:animate-out data-[open=false]:fade-out data-[open=false]:slide-out-to-right-2 data-[open=true]:animate-in data-[open=true]:fade-in data-[open=true]:slide-in-from-right-2 motion-reduce:animate-none motion-reduce:duration-0 ${COMPACT_SHEET}`}
    >
      <Tabs
        value={panel}
        onValueChange={(value) => {
          if (isRoomPanel(value)) onSelect(value);
        }}
        className="min-h-0 flex-1 gap-0"
      >
        <div className="mb-2 flex items-center gap-2">
          <TabsList aria-label={t("navigation")} activateOnFocus className="hidden compact:flex">
            {PANELS.map(({ id, icon: Icon }) => (
              <TabsTrigger key={id} value={id} className="px-2">
                <Icon />
                {t(id)}
                {id === "chat" && hasUnreadChat ? <UnreadChat /> : null}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
            aria-label={t("close", { panel: title })}
            onClick={onClose}
          >
            <XIcon />
          </Button>
        </div>
        <TabsContent value={panel} className="flex min-h-0 flex-col">
          {children}
        </TabsContent>
      </Tabs>
    </section>
  );
}

/** Where content starts inside the {@link RoomPanelFrame} on desktop: its `p-4` plus its border. */
const PANEL_INSET = "calc(1rem + 1px)";

/**
 * The Message input. On desktop it floats at the bottom centre, or sits at the bottom of open Chat,
 * inset like the panel's content and entering with it. The compact layout shows it only at the
 * bottom of the sheet's Chat tab. It stays one element across these places so the draft survives.
 */
export function ChatComposerDock({
  room,
  active,
}: {
  room: Room<unknown, RoomState>;
  active: RoomPanel;
}) {
  return (
    <div
      style={{ "--room-panel-inset": PANEL_INSET } as CSSProperties}
      className={`${
        active === "chat"
          ? "right-[calc(var(--room-overlay-edge)_+_var(--room-panel-inset))] bottom-[calc(var(--room-rail-bottom)_+_var(--room-panel-inset))] w-[calc(var(--room-rail-width)_-_2_*_var(--room-panel-inset))] duration-200 animate-in fade-in slide-in-from-right-2 motion-reduce:animate-none compact:inset-x-3 compact:bottom-[var(--room-safe-bottom)] compact:w-auto"
          : "bottom-6 left-1/2 w-[min(28rem,calc(100vw-3rem))] -translate-x-1/2 compact:hidden"
      } absolute z-20 rounded-lg border bg-background/95 p-2 shadow-lg backdrop-blur-sm`}
    >
      <ChatComposer room={room} />
    </div>
  );
}
