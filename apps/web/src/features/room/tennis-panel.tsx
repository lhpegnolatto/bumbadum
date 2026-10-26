"use client";

import type { RoomState, TennisSteerDirection } from "@bumbadum/protocol";
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
  onSteer,
}: {
  room: Room<unknown, RoomState>;
  state: TennisViewState;
  serverNow: () => number | undefined;
  onJoin: () => void;
  onLeave: () => void;
  onSteer: (direction: TennisSteerDirection | null) => void;
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

  const status = state.isParticipant
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
      className="absolute top-[var(--room-overlay-edge)] left-[var(--room-overlay-edge)] z-20 w-64 rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur-sm compact:top-[calc(var(--room-top-inset)_+_0.75rem)] compact:left-3"
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
        {state.queuePosition === null && !state.isParticipant && state.inHall && (
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
        <p className="mt-2 text-xs text-muted-foreground">{t("controls")}</p>
      )}
      {state.isParticipant && isActiveMatch(state.matchStatus) && (
        <div className="sr-only" aria-live="polite">
          {t("side", { side: state.side === "top" ? t("top") : t("bottom") })}
        </div>
      )}
      <SteeringButtons
        enabled={state.isParticipant && isActiveMatch(state.matchStatus)}
        onSteer={onSteer}
        t={t}
      />
    </section>
  );
}

function SteeringButtons({
  enabled,
  onSteer,
  t,
}: {
  enabled: boolean;
  onSteer: (direction: TennisSteerDirection | null) => void;
  t: ReturnType<typeof useTranslations<"room.tennis">>;
}) {
  return (
    <div className="mt-2 flex gap-2">
      {(["left", "right"] as const).map((direction) => (
        <Button
          key={direction}
          size="sm"
          variant="secondary"
          disabled={!enabled}
          aria-label={t(direction)}
          onPointerDown={() => onSteer(direction)}
          onPointerUp={() => onSteer(null)}
          onPointerCancel={() => onSteer(null)}
          onPointerLeave={() => onSteer(null)}
        >
          {t(direction)}
        </Button>
      ))}
    </div>
  );
}
