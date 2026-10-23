"use client";

import type { RoomState } from "@bumbadum/protocol";
import type { NowPlaying, SkipTally, Track } from "@bumbadum/radio";
import type { Room } from "@colyseus/sdk";
import { createContext, use, useState } from "react";
import { updateSettings, useSettings } from "@/lib/local-settings.ts";
import { useRadio } from "./radio-snapshot.ts";

/** YouTube's own default. */
const DEFAULT_VOLUME = 100;

interface RadioContextValue {
  state: {
    nowPlaying?: NowPlaying;
    queue: readonly Track[];
    skipVote: SkipTally;
    /** This player's volume, 0 to 100: it affects nobody else. */
    volume: number;
    muted: boolean;
  };
  actions: {
    /** While dragging: heard at once, stored only on `keepVolume`. */
    setVolume(volume: number): void;
    keepVolume(volume: number): void;
    setMuted(muted: boolean): void;
  };
  meta: { room: Room<unknown, RoomState> };
}

const RadioContext = createContext<RadioContextValue | null>(null);

/** The room's radio and this player's volume, for the screen, its controls and the queue. */
export function RadioProvider({
  room,
  children,
}: {
  room: Room<unknown, RoomState>;
  children: React.ReactNode;
}) {
  const { nowPlaying, queue, skipVote } = useRadio(room);
  const settings = useSettings();
  const [volume, setVolume] = useState(() => settings?.volume ?? DEFAULT_VOLUME);
  const [muted, setMutedState] = useState(() => settings?.muted ?? false);

  const value: RadioContextValue = {
    state: { nowPlaying, queue, skipVote, volume, muted },
    actions: {
      setVolume,
      keepVolume(kept) {
        setVolume(kept);
        updateSettings({ volume: kept });
      },
      setMuted(next) {
        setMutedState(next);
        updateSettings({ muted: next });
      },
    },
    meta: { room },
  };
  return <RadioContext value={value}>{children}</RadioContext>;
}

export function useRadioContext(): RadioContextValue {
  const value = use(RadioContext);
  if (!value) throw new Error("useRadioContext must be used inside RadioProvider");
  return value;
}
