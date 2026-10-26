"use client";

import type { RoomState } from "@bumbadum/protocol";
import type { Room } from "@colyseus/sdk";
import { CircleDotIcon, LogInIcon, LogOutIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "use-intl";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert.tsx";
import { Button } from "@/components/ui/button.tsx";
import { isActiveMatch, type TennisViewState } from "./use-tennis.ts";

export function TennisPanel({
  room,
  state,
  serverNow,
  onJoin,
  onLeave,
}: {
  room: Room<unknown, RoomState>;
  state: TennisViewState;
  serverNow: () => number | undefined;
  onJoin: () => void;
  onLeave: () => void;
}) {
  const t = useTranslations("room.tennis");
  const [now, setNow] = useState(() => serverNow() ?? Date.now());
  const visible =
    state.inHall ||
    state.queuePosition !== null ||
    state.isParticipant ||
    state.matchStatus !== "idle";
  const countdown = Math.max(0, Math.ceil((state.countdownEndsAt - now) / 1_000));

  useEffect(() => {
    if (!isActiveMatch(state.matchStatus) || state.matchStatus !== "countdown") return;
    const update = () => setNow(serverNow() ?? Date.now());
    update();
    const timer = window.setInterval(update, 100);
    return () => window.clearInterval(timer);
  }, [serverNow, state.matchStatus]);

  if (!visible) return null;

  const status =
    state.matchStatus === "complete" && state.winnerId
      ? state.winnerId === room.sessionId
        ? t("youWin")
        : t("youLose")
      : state.isParticipant
        ? state.matchStatus === "countdown"
          ? t("countdown", { seconds: countdown })
          : state.matchStatus === "complete"
            ? state.winnerId === room.sessionId
              ? t("youWin")
              : t("youLose")
            : t("playing")
        : state.queuePosition === 0
          ? t("next")
          : state.queuePosition !== null
            ? t("inLine", { position: state.queuePosition + 1 })
            : t("ready");

  return (
    <section
      aria-label={t("title")}
      className="absolute top-[var(--room-overlay-edge)] right-[calc(var(--room-rail-width)_+_var(--room-overlay-edge)_+_var(--room-overlay-gap))] z-20 w-64 rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur-sm compact:top-[calc(var(--room-top-inset)_+_0.75rem)] compact:right-3 compact:left-3 compact:w-auto"
    >
      <div className="flex items-center gap-2">
        <CircleDotIcon className="size-4" aria-hidden="true" />
        <h2 className="font-medium">{t("title")}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{status}</p>

      {(state.isParticipant || state.queuePosition !== null) && (
        <div className="mt-2 flex items-center justify-between rounded-md bg-muted/60 px-2 py-1 text-sm">
          <span>{t("score")}</span>
          <strong>
            {state.topScore} — {state.bottomScore}
          </strong>
          <span className="sr-only">
            {t("scoreLabel", { top: state.topScore, bottom: state.bottomScore })}
          </span>
        </div>
      )}

      {state.isNext && (
        <Alert className="mt-2 p-2">
          <AlertTitle className="text-sm">{t("youAreNext")}</AlertTitle>
          <AlertDescription>{t("getReady")}</AlertDescription>
        </Alert>
      )}

      <div className="mt-3 flex gap-2">
        {state.queuePosition === null && !state.isParticipant && state.inHall && !state.inCar && (
          <Button size="sm" onClick={onJoin}>
            <LogInIcon />
            {t("join")}
          </Button>
        )}
        {(state.queuePosition !== null || state.isParticipant) && (
          <Button size="sm" variant="outline" onClick={onLeave}>
            <LogOutIcon />
            {state.isParticipant ? t("leaveMatch") : t("leaveLine")}
          </Button>
        )}
      </div>
      {state.isParticipant && isActiveMatch(state.matchStatus) && (
        <div className="sr-only" aria-live="polite">
          {t("side", { side: state.side === "top" ? t("top") : t("bottom") })}
        </div>
      )}
    </section>
  );
}
