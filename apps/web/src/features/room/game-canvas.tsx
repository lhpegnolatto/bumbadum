"use client";

import type { RoomState } from "@bumbadum/protocol";
import type { Room } from "@colyseus/sdk";
import { useEffect, useRef } from "react";
import { useTranslations } from "use-intl";

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
      const engine = await mountGameEngine(container);
      if (cancelled) {
        engine.destroy();
        return;
      }
      const onStateChange = (state: RoomState) => engine.applyState(state);
      onStateChange(room.state);
      room.onStateChange(onStateChange);
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

  return <div ref={containerRef} role="img" aria-label={t("canvasLabel")} />;
}
