"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "use-intl";
import { exposeToE2E, isE2E } from "@/lib/e2e.ts";
import { cn } from "@/lib/utils";
import { useRadioContext } from "./radio-provider.tsx";
import type { ScreenPlayer } from "./screen-player.ts";
import { type ScreenReading, type ScreenSync, syncScreen } from "./screen-sync.ts";
import { localNow, syncServerClock } from "./server-clock.ts";

declare global {
  interface BumbadumE2E {
    /** What the screen plays and where, against where the radio is. */
    screen?(): ScreenReading | undefined;
  }
}

/**
 * The room's screen: the YouTube player kept on the radio's time. Always
 * visible, 16:9 and at least 400×225 px, with nothing drawn over it
 * (ADR-0006, ADR-0010); a "nothing playing" card stands in while the radio is
 * silent.
 */
export function RadioScreen() {
  const t = useTranslations("radio");
  const { state, meta } = useRadioContext();
  const { nowPlaying, volume, muted } = state;
  const hostRef = useRef<HTMLDivElement>(null);
  const syncRef = useRef<ScreenSync>(undefined);
  const playerRef = useRef<ScreenPlayer>(undefined);
  // Read when the player is ready, which comes later than the first render.
  const latest = useRef({ nowPlaying, volume, muted });
  useEffect(() => {
    latest.current = { nowPlaying, volume, muted };
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let stop: (() => void) | undefined;
    const clock = syncServerClock(meta.room);

    // Loaded on demand: the YouTube player only runs in the browser, and e2e runs never load it.
    const create = isE2E
      ? import("./fake-screen-player.ts").then((module) => module.createFakeScreenPlayer)
      : import("./youtube-screen-player.ts").then((module) => module.createYouTubeScreenPlayer);
    create
      .then((createPlayer) => createPlayer(host))
      .then((player) => {
        if (cancelled) {
          player.destroy();
          return;
        }
        const sync = syncScreen({ player, serverNow: clock.now, localNow });
        const { nowPlaying, volume, muted } = latest.current;
        player.setVolume(volume, muted);
        sync.show(nowPlaying);
        playerRef.current = player;
        syncRef.current = sync;
        exposeToE2E({ screen: sync.reading });
        stop = () => {
          sync.stop();
          player.destroy();
        };
      });

    return () => {
      cancelled = true;
      clock.stop();
      stop?.();
      playerRef.current = undefined;
      syncRef.current = undefined;
    };
  }, [meta.room]);

  useEffect(() => {
    syncRef.current?.show(nowPlaying);
  }, [nowPlaying]);

  useEffect(() => {
    playerRef.current?.setVolume(volume, muted);
  }, [volume, muted]);

  return (
    <section
      aria-label={t("screenLabel")}
      className="relative aspect-video min-h-[225px] w-full min-w-[400px] shrink-0 overflow-hidden rounded-lg bg-black"
    >
      {/* Never hidden while a track is on air: only swapped for the card when silent. */}
      <div ref={hostRef} className={cn("size-full", !nowPlaying && "invisible")} />
      {!nowPlaying && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-6 text-center text-white">
          <p className="font-medium">{t("nothingPlaying")}</p>
          <p className="text-sm text-white/70">{t("nothingPlayingHint")}</p>
        </div>
      )}
    </section>
  );
}
