"use client";

import type { DrawnPlayer } from "@bumbadum/game-engine";
import { type RoomState, STEP_MESSAGE } from "@bumbadum/protocol";
import type { Room } from "@colyseus/sdk";
import { useEffect, useRef } from "react";
import { useTranslations } from "use-intl";

declare global {
  interface Window {
    /** Set only in end-to-end runs: what the canvas shows, since tests cannot read its pixels. */
    bumbadumE2E?: { drawnPlayers(): DrawnPlayer[] };
  }
}

/** Mounts the PixiJS engine and feeds it every state patch, without re-rendering React. */
export function GameCanvas({ room }: { room: Room<unknown, RoomState> }) {
  const t = useTranslations("room");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let stop: (() => void) | undefined;

    // Loaded on demand: PixiJS only runs in the browser.
    import("@bumbadum/game-engine").then(async ({ mountGameEngine }) => {
      const engine = await mountGameEngine(container, {
        sessionId: room.sessionId,
        sendStep: (direction) => room.send(STEP_MESSAGE, direction),
      });
      if (cancelled) {
        engine.destroy();
        return;
      }
      const onStateChange = (state: RoomState) => engine.applyState(state);
      onStateChange(room.state);
      room.onStateChange(onStateChange);
      if (process.env.NEXT_PUBLIC_E2E === "1") {
        window.bumbadumE2E = { drawnPlayers: () => engine.drawnPlayers() };
      }
      stop = () => {
        room.onStateChange.remove(onStateChange);
        engine.destroy();
      };
    });

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [room]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={t("canvasLabel")}
      className="h-[calc(100dvh-3rem)] w-full"
    />
  );
}
