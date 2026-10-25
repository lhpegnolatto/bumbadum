import { DEFAULT_DANCE } from "@bumbadum/avatar";
import { DANCE_MESSAGE, danceOf, type RoomState } from "@bumbadum/protocol";
import type { Room } from "@colyseus/sdk";
import { useEffect, useMemo, useState } from "react";

/** Whether the local player is dancing, and how they start or stop: the room decides (ADR-0021). */
export function useDance(room: Room<unknown, RoomState>) {
  const [dancing, setDancing] = useState(false);

  useEffect(() => {
    const read = (state: RoomState) => {
      const me = state.players?.get(room.sessionId);
      setDancing(me !== undefined && danceOf(me) !== null);
    };
    read(room.state);
    room.onStateChange(read);
    return () => room.onStateChange.remove(read);
  }, [room]);

  const actions = useMemo(
    () => ({
      toggle() {
        const me = room.state.players?.get(room.sessionId);
        room.send(DANCE_MESSAGE, me && danceOf(me) ? null : DEFAULT_DANCE);
      },
      /** Sent even when the room has not yet shown a dance just started, so it never outlives this. */
      stop() {
        room.send(DANCE_MESSAGE, null);
      },
    }),
    [room],
  );

  return { dancing, ...actions };
}
