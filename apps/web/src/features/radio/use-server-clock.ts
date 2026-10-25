import { useCallback, useEffect, useRef } from "react";
import { type PingChannel, type ServerClock, syncServerClock } from "./server-clock.ts";

/**
 * The room's one estimate of the server clock (ADR-0004), shared by the radio and the dancers:
 * a stable function giving the server's time now, or `undefined` until it is known.
 */
export function useServerClock(room: PingChannel): () => number | undefined {
  const clockRef = useRef<ServerClock>(undefined);

  useEffect(() => {
    const clock = syncServerClock(room);
    clockRef.current = clock;
    return () => {
      clock.stop();
      clockRef.current = undefined;
    };
  }, [room]);

  return useCallback(() => clockRef.current?.now(), []);
}
