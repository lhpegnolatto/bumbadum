import { ROOM_TYPE } from "@bumbadum/protocol";
import { createEndpoint, createRouter, defineRoom, defineServer } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { LobbyRoom } from "./room/lobby-room.ts";

const health = createEndpoint("/health", { method: "GET" }, async () => ({ ok: true }));

export function createServer() {
  return defineServer({
    transport: new WebSocketTransport(),
    rooms: {
      [ROOM_TYPE]: defineRoom(LobbyRoom).filterBy(["slug"]),
    },
    routes: createRouter({ health }),
  });
}
