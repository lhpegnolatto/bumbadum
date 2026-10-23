"use client";

import { isJoinRejection, type JoinRejection, ROOM_TYPE, type RoomState } from "@bumbadum/protocol";
import { Callbacks, Client, MatchMakeError, type Room } from "@colyseus/sdk";
import { useEffect, useState } from "react";
import { SERVER_URL } from "@/lib/server-url.ts";

/** Wait before trying to join again after a failed join or a lost room. */
const RETRY_DELAY_MS = 3000;

export type RoomStatus =
  | { kind: "connecting" }
  | { kind: "joined"; room: Room<unknown, RoomState> }
  | { kind: "reconnecting" }
  | { kind: "rejected"; reason: JoinRejection };

export interface PresentPlayer {
  sessionId: string;
  nickname: string;
}

/**
 * Joins the room and keeps trying: the SDK reconnects short drops by itself;
 * when the room is lost (e.g. the server restarted) this joins it again.
 */
export function useRoom(slug: string, nickname: string) {
  const [status, setStatus] = useState<RoomStatus>({ kind: "connecting" });
  const [players, setPlayers] = useState<PresentPlayer[]>([]);

  useEffect(() => {
    const client = new Client(SERVER_URL);
    let disposed = false;
    let current: Room<unknown, RoomState> | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    let joinedOnce = false;

    const retry = () => {
      setStatus({ kind: joinedOnce ? "reconnecting" : "connecting" });
      retryTimer = setTimeout(join, RETRY_DELAY_MS);
    };

    async function join() {
      let room: Room<unknown, RoomState>;
      try {
        room = await client.join<RoomState>(ROOM_TYPE, { slug, nickname });
      } catch (error) {
        if (disposed) return;
        if (error instanceof MatchMakeError && isJoinRejection(error.message)) {
          setStatus({ kind: "rejected", reason: error.message });
        } else {
          retry();
        }
        return;
      }
      if (disposed) {
        room.leave();
        return;
      }

      current = room;
      joinedOnce = true;
      setPlayers([]);
      const callbacks = Callbacks.get(room);
      callbacks.onAdd("players", (player, sessionId) => {
        setPlayers((list) => [...list, { sessionId, nickname: player.nickname }]);
      });
      callbacks.onRemove("players", (_player, sessionId) => {
        setPlayers((list) => list.filter((p) => p.sessionId !== sessionId));
      });
      room.onDrop(() => setStatus({ kind: "reconnecting" }));
      room.onReconnect(() => setStatus({ kind: "joined", room }));
      room.onLeave(() => {
        if (!disposed) retry();
      });
      setStatus({ kind: "joined", room });
    }

    join();
    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      current?.leave();
    };
  }, [slug, nickname]);

  return { status, players };
}
