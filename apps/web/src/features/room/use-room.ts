"use client";

import type { Avatar } from "@bumbadum/avatar";
import { isJoinRejection, ROOM_TYPE, type RoomState } from "@bumbadum/protocol";
import { Callbacks, Client, MatchMakeError, type Room } from "@colyseus/sdk";
import { useEffect, useRef, useState } from "react";
import { watchChat } from "@/features/chat/chat-feed.ts";
import { exposeToE2E } from "@/lib/e2e.ts";
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

declare global {
  interface BumbadumE2E {
    /**
     * Leaves the room for good, resolving once the server has let the seat go:
     * a closed browser would hold it for the whole reconnection window.
     */
    leave?(): Promise<void>;
  }
}

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
  // Read at each join, so a rejoin wears the latest avatar and Nickname without a change to
  // either one reconnecting: the room already has it.
  const worn = useRef(avatar);
  const named = useRef(nickname);
  useEffect(() => {
    worn.current = avatar;
    named.current = nickname;
  }, [avatar, nickname]);

  useEffect(() => {
    const client = new Client(SERVER_URL);
    let joined: LobbyRoom | undefined;

    async function join(): Promise<JoinOutcome<LobbyRoom>> {
      let room: LobbyRoom;
      try {
        room = await client.join<RoomState>(ROOM_TYPE, {
          slug,
          nickname: named.current,
          avatar: worn.current,
        });
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
        callbacks.listen(player, "nickname", (nickname) => {
          setPlayers((list) =>
            list.map((p) => (p.sessionId === sessionId ? { ...p, nickname } : p)),
          );
        });
      });
      callbacks.onRemove("players", (_player, sessionId) => {
        setPlayers((list) => list.filter((p) => p.sessionId !== sessionId));
      });
      joined = room;
      return { kind: "joined", room };
    }

    function connect() {
      return connectToRoom({ clock: browserClock, isServerAwake, join, onChange: setStatus });
    }
    let current = connect();
    connection.current = current;

    // A page going away leaves at once: the browser's own close would count as a drop,
    // and a reload would meet its old seat, held for the whole reconnection window.
    const leaveOnHide = () => current.close();
    // A page back from the back/forward cache left when it was hidden, so it joins again.
    const rejoinOnShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      current = connect();
      connection.current = current;
    };
    window.addEventListener("pagehide", leaveOnHide);
    window.addEventListener("pageshow", rejoinOnShow);

    exposeToE2E({
      leave: () =>
        new Promise((resolve) => {
          const room = joined;
          if (!room?.connection.isOpen) return resolve();
          room.onLeave(() => resolve());
          current.close();
        }),
    });
    return () => {
      window.removeEventListener("pagehide", leaveOnHide);
      window.removeEventListener("pageshow", rejoinOnShow);
      current.close();
    };
  }, [slug]);

  return { status, players, retry: () => connection.current?.retry() };
}
