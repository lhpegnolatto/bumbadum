"use client";

import type { Direction, DrawnPlayer, GameEngine } from "@bumbadum/game-engine";
import { CHAT_MESSAGE, type ChatMessage, type RoomState, STEP_MESSAGE } from "@bumbadum/protocol";
import type { Room } from "@colyseus/sdk";
import { type Ref, useEffect, useImperativeHandle, useRef } from "react";
import { useTranslations } from "use-intl";
import { exposeToE2E } from "@/lib/e2e.ts";

declare global {
  interface BumbadumE2E {
    /** What the canvas shows, since tests cannot read its pixels. */
    drawnPlayers?(): DrawnPlayer[];
  }
}

/** What the room drives on the mounted engine besides its props. */
export interface GameCanvasHandle {
  /** Walks the local player towards `direction`, as a held walking key would, until steered elsewhere or `null`. */
  steer(direction: Direction | null): void;
}

/**
 * Mounts the PixiJS engine and feeds it every state patch and chat message
 * (as speech bubbles), without re-rendering React.
 */
export function GameCanvas({
  ref,
  room,
  walking,
  topInset,
  serverNow,
}: {
  ref?: Ref<GameCanvasHandle>;
  room: Room<unknown, RoomState>;
  /** The server's time now, or `undefined` until it is known: dancers keep in step with it (ADR-0021). */
  serverNow: () => number | undefined;
  /** Whether the walking keys move the local player; off while a panel such as the wardrobe is open. */
  walking: boolean;
  /** CSS pixels the Screen and Radio strip cover at the top: the camera frames the local player below them. */
  topInset: number;
}) {
  const t = useTranslations("room");
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine>(undefined);
  const walkingRef = useRef(walking);
  const topInsetRef = useRef(topInset);

  useImperativeHandle(
    ref,
    () => ({ steer: (direction) => engineRef.current?.steer(direction) }),
    [],
  );

  useEffect(() => {
    walkingRef.current = walking;
    engineRef.current?.setWalking(walking);
  }, [walking]);

  useEffect(() => {
    topInsetRef.current = topInset;
    engineRef.current?.setTopInset(topInset);
  }, [topInset]);

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
        serverNow,
      });
      if (cancelled) {
        engine.destroy();
        return;
      }
      engine.setWalking(walkingRef.current);
      engine.setTopInset(topInsetRef.current);
      engineRef.current = engine;
      const onStateChange = (state: RoomState) => engine.applyState(state);
      onStateChange(room.state);
      room.onStateChange(onStateChange);
      const stopBubbles = room.onMessage<ChatMessage>(CHAT_MESSAGE, (message) =>
        engine.showBubble(message.senderId, message.text),
      );
      exposeToE2E({ drawnPlayers: () => engine.drawnPlayers() });
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
  }, [room, serverNow]);

  return (
    <div ref={containerRef} role="img" aria-label={t("canvasLabel")} className="h-full w-full" />
  );
}
