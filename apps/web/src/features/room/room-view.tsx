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
import { NowPlayingCaption } from "@/features/radio/now-playing.tsx";
import { QueueList } from "@/features/radio/queue-list.tsx";
import { RadioProvider } from "@/features/radio/radio-provider.tsx";
import { RadioScreen } from "@/features/radio/radio-screen.tsx";
import { VolumeControl } from "@/features/radio/volume-control.tsx";
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
  const [clickedJoin, setClickedJoin] = useState(hasClickedOnPage);

  useEffect(() => {
    if (!nickname) router.replace("/");
  }, [nickname, router]);

  if (!nickname) return null;
  if (!clickedJoin) return <JoinGate nickname={nickname} onJoin={() => setClickedJoin(true)} />;
  return <ConnectedRoom slug={slug} nickname={nickname} avatar={avatar} />;
}

/**
 * Browsers unlock autoplay only after a click on the page. Coming from the
 * home page's Join button that click already happened; a shared link or a
 * reload asks for it here, before joining.
 */
function hasClickedOnPage(): boolean {
  return typeof navigator !== "undefined" && navigator.userActivation?.hasBeenActive === true;
}

function JoinGate({ nickname, onJoin }: { nickname: string; onJoin: () => void }) {
  const t = useTranslations("room");
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      <p>{t("joinGate", { nickname })}</p>
      <Button onClick={onJoin}>{t("join")}</Button>
    </main>
  );
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
      {/* The side column (ADR-0010): the screen on top, always visible, then the queue and the chat. */}
      <aside className="flex h-[calc(100dvh-3rem)] w-[400px] shrink-0 flex-col gap-4">
        <RadioProvider room={room}>
          <div className="flex shrink-0 flex-col gap-2">
            <RadioScreen />
            <div className="flex items-center justify-end gap-2">
              <NowPlayingCaption />
              <VolumeControl />
            </div>
          </div>
          <QueueList />
        </RadioProvider>
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
