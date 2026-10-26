"use client";

import { NICKNAME_MESSAGE, type RoomState } from "@bumbadum/protocol";
import type { Room } from "@colyseus/sdk";
import { useEffect, useRef } from "react";
import { updateSettings } from "@/lib/local-settings.ts";
import { browserClock } from "./connection.ts";
import {
  createNicknameSender,
  NICKNAME_CHANGE_INTERVAL_MS,
  type NicknameSender,
} from "./nickname-sender.ts";

/**
 * Returns how the player changes their Nickname: kept in localStorage and sent
 * to the room. Expects a Nickname `parseNickname` has already accepted.
 */
export function useChangeNickname(room: Room<unknown, RoomState>): (nickname: string) => void {
  const sender = useRef<NicknameSender>(undefined);

  useEffect(() => {
    const current = createNicknameSender({
      clock: browserClock,
      intervalMs: NICKNAME_CHANGE_INTERVAL_MS,
      send: (nickname) => room.send(NICKNAME_MESSAGE, nickname),
    });
    sender.current = current;
    return () => current.stop();
  }, [room]);

  return (nickname) => {
    updateSettings({ nickname });
    sender.current?.rename(nickname);
  };
}
