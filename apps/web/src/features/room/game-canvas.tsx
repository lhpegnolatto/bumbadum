"use client";

import type { DrawnPlayer, GameEngine } from "@bumbadum/game-engine";
import { CHAT_MESSAGE, type ChatMessage, type RoomState, STEP_MESSAGE } from "@bumbadum/protocol";
import type { Room } from "@colyseus/sdk";
import { useEffect, useRef } from "react";
import { useTranslations } from "use-intl";

declare global {
  interface Window {
    /** Set only in end-to-end runs: what the canvas shows, since tests cannot read its pixels. */
    bumbadumE2E?: { drawnPlayers(): DrawnPlayer[] };
  }
}

/**
 * Mounts the PixiJS engine and feeds it every state patch and chat message
 * (as speech bubbles), without re-rendering React.
 */
export function GameCanvas({
  room,
  walking,
}: {
  room: Room<unknown, RoomState>;
  /** Whether the walking keys move the local player; off while a panel such as the wardrobe is open. */
  walking: boolean;
}) {
  const t = useTranslations("room");
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine>(undefined);
  const walkingRef = useRef(walking);

  useEffect(() => {
    walkingRef.current = walking;
    engineRef.current?.setWalking(walking);
  }, [walking]);

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
      engine.setWalking(walkingRef.current);
      engineRef.current = engine;
      const onStateChange = (state: RoomState) => engine.applyState(state);
      onStateChange(room.state);
      room.onStateChange(onStateChange);
      const stopBubbles = room.onMessage<ChatMessage>(CHAT_MESSAGE, (message) =>
        engine.showBubble(message.senderId, message.text),
      );
      if (process.env.NEXT_PUBLIC_E2E === "1") {
        window.bumbadumE2E = { drawnPlayers: () => engine.drawnPlayers() };
      }
      stop = () => {
        engineRef.current = undefined;
        room.onStateChange.remove(onStateChange);
        stopBubbles();
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
