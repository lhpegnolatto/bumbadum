"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslations } from "use-intl";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Button } from "@/components/ui/button.tsx";
import { ChatPanel } from "@/features/chat/chat-panel.tsx";
import { useSettings } from "@/lib/local-settings.ts";
import { GameCanvas } from "./game-canvas.tsx";
import { PlayerList } from "./player-list.tsx";
import { useRoom } from "./use-room.ts";
import { WaitingScreen, WaitingTimedOut } from "./waiting-screen.tsx";

export function RoomView({ slug }: { slug: string }) {
  const nickname = useSettings()?.nickname;
  const router = useRouter();

  useEffect(() => {
    if (!nickname) router.replace("/");
  }, [nickname, router]);

  return nickname ? <ConnectedRoom slug={slug} nickname={nickname} /> : null;
}

function ConnectedRoom({ slug, nickname }: { slug: string; nickname: string }) {
  const t = useTranslations();
  const { status, players, retry } = useRoom(slug, nickname);

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

  return (
    <main className="flex min-h-dvh gap-6 p-6">
      <div className="min-w-0 flex-1">
        <GameCanvas room={status.room} />
      </div>
      {/* The side column (ADR-0010): the screen and the queue go above the chat. */}
      <aside className="flex h-[calc(100dvh-3rem)] w-[400px] shrink-0 flex-col gap-4">
        <PlayerList players={players} me={status.room.sessionId} />
        <ChatPanel room={status.room} />
      </aside>
    </main>
  );
}
