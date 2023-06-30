"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

interface UseSocketProps {
  namespace: string;
}

export function useSocket({ namespace }: UseSocketProps) {
  const [currentSocket, setCurrentSocket] = useState<Socket<
    DefaultEventsMap,
    DefaultEventsMap
  > | null>(null);

  useEffect(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_API_BASE_URL}/${namespace}`, {
      extraHeaders: { "Access-Control-Allow-Origin": "*" },
    });

    setCurrentSocket(socket);

    return () => {
      socket.disconnect();
    };
  }, [namespace]);

  return { socket: currentSocket };
}
