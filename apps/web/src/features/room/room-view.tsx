"use client";

import { type Avatar, DEFAULT_AVATAR } from "@bumbadum/avatar";
import type { RoomState } from "@bumbadum/protocol";
import type { Room } from "@colyseus/sdk";
import { ShirtIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "use-intl";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useWearAvatar } from "@/features/avatar/use-wear-avatar.ts";
import { WardrobePanel } from "@/features/avatar/wardrobe-panel.tsx";
import { ChatPanel } from "@/features/chat/chat-panel.tsx";
import { useSettings } from "@/lib/local-settings.ts";
import { GameCanvas } from "./game-canvas.tsx";
import { PlayerList } from "./player-list.tsx";
import { type PresentPlayer, useRoom } from "./use-room.ts";
import { WaitingScreen, WaitingTimedOut } from "./waiting-screen.tsx";

export function RoomView({ slug }: { slug: string }) {
  const settings = useSettings();
  const nickname = settings?.nickname;
  const avatar = settings?.avatar ?? DEFAULT_AVATAR;
  const router = useRouter();

  useEffect(() => {
    if (!nickname) router.replace("/");
  }, [nickname, router]);

  return nickname ? <ConnectedRoom slug={slug} nickname={nickname} avatar={avatar} /> : null;
}

function ConnectedRoom({
  slug,
  nickname,
  avatar,
}: {
  slug: string;
  nickname: string;
  avatar: Avatar;
}) {
  const t = useTranslations();
  const { status, players, retry } = useRoom(slug, nickname, avatar);

  if (!status) return null;
  if (status.kind === "waiting") return <WaitingScreen {...status} />;
  if (status.kind === "timed-out") return <WaitingTimedOut onRetry={retry} />;
  if (status.kind === "rejected") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
        <Alert variant="destructive">
          <AlertDescription>{t(`joinRejection.${status.rejection}`)}</AlertDescription>
        </Alert>
        <Button render={<Link href="/" />} nativeButton={false} variant="outline">
          {t("room.backHome")}
        </Button>
      </main>
    );
  }

  return <JoinedRoom room={status.room} players={players} worn={avatar} />;
}

function JoinedRoom({
  room,
  players,
  worn,
}: {
  room: Room<unknown, RoomState>;
  players: PresentPlayer[];
  worn: Avatar;
}) {
  const t = useTranslations("wardrobe");
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const wear = useWearAvatar(room);

  useEffect(() => {
    function openOnC(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "c" || event.repeat || event.defaultPrevented) return;
      if (event.ctrlKey || event.metaKey || event.altKey || isTextField(event.target)) return;
      setWardrobeOpen(true);
    }
    document.addEventListener("keydown", openOnC);
    return () => document.removeEventListener("keydown", openOnC);
  }, []);

  return (
    <main className="flex min-h-dvh gap-6 p-6">
      {/* The wardrobe opens over the canvas, never over the side column (ADR-0010). */}
      <div className="relative min-w-0 flex-1">
        <GameCanvas room={room} walking={!wardrobeOpen} />
        {wardrobeOpen ? (
          <WardrobePanel worn={worn} onWear={wear} onClose={() => setWardrobeOpen(false)} />
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-2 left-2"
            aria-keyshortcuts="C"
            title={t("shortcut")}
            onClick={() => setWardrobeOpen(true)}
          >
            <ShirtIcon />
            {t("open")}
          </Button>
        )}
      </div>
      {/* The side column (ADR-0010): the screen and the queue go above the chat. */}
      <aside className="flex h-[calc(100dvh-3rem)] w-[400px] shrink-0 flex-col gap-4">
        <PlayerList players={players} me={room.sessionId} />
        <ChatPanel room={room} />
      </aside>
    </main>
  );
}

/** Keys typed into a text field, such as the chat, are text, not shortcuts. */
function isTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.closest("input, textarea, select") !== null;
}
