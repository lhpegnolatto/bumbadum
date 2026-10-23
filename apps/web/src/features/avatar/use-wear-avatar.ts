"use client";

import type { Avatar } from "@bumbadum/avatar";
import { AVATAR_MESSAGE, type RoomState } from "@bumbadum/protocol";
import type { Room } from "@colyseus/sdk";
import { useEffect, useRef } from "react";
import { updateSettings } from "@/lib/local-settings.ts";
import { browserClock } from "../room/connection.ts";
import {
  AVATAR_CHANGE_INTERVAL_MS,
  type AvatarSender,
  createAvatarSender,
} from "./avatar-sender.ts";

/** Returns how the player puts on an avatar: kept in localStorage and sent to the room. */
export function useWearAvatar(room: Room<unknown, RoomState>): (avatar: Avatar) => void {
  const sender = useRef<AvatarSender>(undefined);

  useEffect(() => {
    const current = createAvatarSender({
      clock: browserClock,
      intervalMs: AVATAR_CHANGE_INTERVAL_MS,
      send: (avatar) => room.send(AVATAR_MESSAGE, avatar),
    });
    sender.current = current;
    return () => current.stop();
  }, [room]);

  return (avatar) => {
    updateSettings({ avatar });
    sender.current?.wear(avatar);
  };
}
