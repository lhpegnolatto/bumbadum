import type { RadioState, RoomState, TrackState } from "@bumbadum/protocol";
import type { NowPlaying, Track } from "@bumbadum/radio";
import type { Room } from "@colyseus/sdk";
import { useSyncExternalStore } from "react";

/** The room's radio as the UI reads it, in the radio domain's terms. */
export interface RadioSnapshot {
  nowPlaying?: NowPlaying;
  queue: readonly Track[];
}

const silent: RadioSnapshot = { queue: [] };

type LobbyRoom = Room<unknown, RoomState>;

/**
 * The room's radio, re-rendering only when the radio changes: state patches
 * arrive many times a second for movement alone.
 */
export function useRadio(room: LobbyRoom): RadioSnapshot {
  return useSyncExternalStore(
    (listener) => subscribe(room, listener),
    () => snapshotOf(room),
    () => silent,
  );
}

function subscribe(room: LobbyRoom, listener: () => void) {
  room.onStateChange(listener);
  return () => room.onStateChange.remove(listener);
}

const cache = new WeakMap<LobbyRoom, { key: string; snapshot: RadioSnapshot }>();

function snapshotOf(room: LobbyRoom): RadioSnapshot {
  const radio = room.state.radio as RadioState | undefined;
  const key = keyOf(radio);
  const cached = cache.get(room);
  if (cached?.key === key) return cached.snapshot;
  const snapshot = readRadio(radio);
  cache.set(room, { key, snapshot });
  return snapshot;
}

function keyOf(radio: RadioState | undefined): string {
  if (!radio) return "";
  const onAir = radio.nowPlaying;
  const queue = [...radio.queue].map((track) => track.videoId).join(",");
  return `${onAir?.track.videoId ?? ""}@${onAir?.startedAt ?? ""}|${queue}`;
}

function readRadio(radio: RadioState | undefined): RadioSnapshot {
  if (!radio) return silent;
  const onAir = radio.nowPlaying;
  return {
    ...(onAir && { nowPlaying: { track: readTrack(onAir.track), startedAt: onAir.startedAt } }),
    queue: [...radio.queue].map(readTrack),
  };
}

function readTrack(track: TrackState): Track {
  return {
    videoId: track.videoId,
    title: track.title,
    durationMs: track.durationMs,
    submitter: { id: track.submitterId, nickname: track.submitterNickname },
  };
}
