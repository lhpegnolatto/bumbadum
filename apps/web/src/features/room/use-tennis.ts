"use client";

import {
  parseTennisNotice,
  type RoomState,
  TENNIS_JOIN_MESSAGE,
  TENNIS_LEAVE_MESSAGE,
  TENNIS_NOTICE,
  TENNIS_STEER_MESSAGE,
  type TennisSteerDirection,
} from "@bumbadum/protocol";
import type { Room } from "@colyseus/sdk";
import { useEffect, useMemo, useRef, useState } from "react";
import { isTennisHallPosition } from "./tennis.ts";

type LobbyRoom = Room<unknown, RoomState>;

export interface TennisViewState {
  inHall: boolean;
  inCar: boolean;
  queuePosition: number | null;
  matchStatus: RoomState["tennis"]["matchStatus"];
  countdownEndsAt: number;
  topScore: number;
  bottomScore: number;
  winnerId: string;
  isParticipant: boolean;
  side: "top" | "bottom" | null;
  isNext: boolean;
}

export function useTennis(room: LobbyRoom) {
  const [state, setState] = useState<TennisViewState>(() => readTennisState(room));
  const noticeTimeout = useRef<number | undefined>(undefined);

  useEffect(() => {
    const read = () =>
      setState((current) => ({ ...readTennisState(room), isNext: current.isNext }));
    read();
    room.onStateChange(read);
    return () => room.onStateChange.remove(read);
  }, [room]);

  useEffect(() => {
    const stop = room.onMessage<unknown>(TENNIS_NOTICE, (payload) => {
      if (!parseTennisNotice(payload)) return;
      setState((current) => ({ ...current, isNext: true }));
      if (noticeTimeout.current !== undefined) window.clearTimeout(noticeTimeout.current);
      noticeTimeout.current = window.setTimeout(
        () => setState((current) => ({ ...current, isNext: false })),
        6_000,
      );
    });
    return () => {
      stop();
      if (noticeTimeout.current !== undefined) window.clearTimeout(noticeTimeout.current);
    };
  }, [room]);

  useEffect(() => {
    if (state.isParticipant || state.matchStatus === "complete") {
      setState((current) => (current.isNext ? { ...current, isNext: false } : current));
    }
  }, [state.isParticipant, state.matchStatus]);

  const actions = useMemo(
    () => ({
      join: () => room.send(TENNIS_JOIN_MESSAGE),
      leave: () => room.send(TENNIS_LEAVE_MESSAGE),
      steer: (direction: TennisSteerDirection | null) => room.send(TENNIS_STEER_MESSAGE, direction),
    }),
    [room],
  );

  return { state, ...actions };
}

export function isActiveMatch(status: TennisViewState["matchStatus"]): boolean {
  return status === "countdown" || status === "rally";
}

function readTennisState(room: LobbyRoom): TennisViewState {
  const me = room.state?.players?.get(room.sessionId);
  const tennis = room.state?.tennis;
  if (!tennis) {
    return {
      inHall: me ? isTennisHallPosition(me.x, me.y) : false,
      inCar: Boolean(me?.carId),
      queuePosition: null,
      matchStatus: "idle",
      countdownEndsAt: 0,
      topScore: 0,
      bottomScore: 0,
      winnerId: "",
      isParticipant: false,
      side: null,
      isNext: false,
    };
  }
  return {
    inHall: me ? isTennisHallPosition(me.x, me.y) : false,
    inCar: Boolean(me?.carId),
    queuePosition:
      tennis.queue.indexOf(room.sessionId) >= 0 ? tennis.queue.indexOf(room.sessionId) : null,
    matchStatus: tennis.matchStatus,
    countdownEndsAt: tennis.countdownEndsAt,
    topScore: tennis.score.top,
    bottomScore: tennis.score.bottom,
    winnerId: tennis.winnerId,
    isParticipant: tennis.participants.has(room.sessionId),
    side: tennis.participants.get(room.sessionId)?.side ?? null,
    isNext: false,
  };
}
