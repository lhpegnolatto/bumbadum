"use client";

import type { Avatar } from "@bumbadum/avatar";
import { isJoinRejection, ROOM_TYPE, type RoomState } from "@bumbadum/protocol";
import { Callbacks, Client, MatchMakeError, type Room } from "@colyseus/sdk";
import { useEffect, useRef, useState } from "react";
import { watchChat } from "@/features/chat/chat-feed.ts";
import { isServerAwake } from "@/lib/server-health.ts";
import { SERVER_URL } from "@/lib/server-url.ts";
import {
  browserClock,
  type ConnectionStatus,
  connectToRoom,
  type JoinOutcome,
  type RoomConnection,
} from "./connection.ts";

type LobbyRoom = Room<unknown, RoomState>;

export type RoomStatus = ConnectionStatus<LobbyRoom>;

export interface PresentPlayer {
  sessionId: string;
  nickname: string;
}

/**
 * Joins the room and keeps the player in it, waiting for a sleeping server to
 * wake and reconnecting after a drop (see `connectToRoom`).
 */
export function useRoom(slug: string, nickname: string, avatar: Avatar) {
  const [status, setStatus] = useState<RoomStatus | undefined>();
  const [players, setPlayers] = useState<PresentPlayer[]>([]);
  const connection = useRef<RoomConnection>(undefined);
  // Read at each join, so a rejoin wears the latest avatar without the avatar itself reconnecting.
  const worn = useRef(avatar);
  useEffect(() => {
    worn.current = avatar;
  }, [avatar]);

  useEffect(() => {
    const client = new Client(SERVER_URL);

    async function join(): Promise<JoinOutcome<LobbyRoom>> {
      let room: LobbyRoom;
      try {
        room = await client.join<RoomState>(ROOM_TYPE, { slug, nickname, avatar: worn.current });
      } catch (error) {
        if (error instanceof MatchMakeError && isJoinRejection(error.message)) {
          return { kind: "rejected", rejection: error.message };
        }
        return { kind: "failed" };
      }
      // Before any await: the server pushes the chat history as soon as we join.
      watchChat(room);
      setPlayers([]);
      const callbacks = Callbacks.get(room);
      callbacks.onAdd("players", (player, sessionId) => {
        setPlayers((list) => [...list, { sessionId, nickname: player.nickname }]);
      });
      callbacks.onRemove("players", (_player, sessionId) => {
        setPlayers((list) => list.filter((p) => p.sessionId !== sessionId));
      });
      return { kind: "joined", room };
    }

    // Every attempt, including a rejoin after a lost room, uses the same nickname.
    const current = connectToRoom({
      clock: browserClock,
      isServerAwake,
      join,
      onChange: setStatus,
    });
    connection.current = current;
    return () => current.close();
  }, [slug, nickname]);

  return { status, players, retry: () => connection.current?.retry() };
}
