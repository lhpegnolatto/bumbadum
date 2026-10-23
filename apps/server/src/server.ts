import { ROOM_TYPE } from "@bumbadum/protocol";
import { createEndpoint, createRouter, defineRoom, defineServer } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { LobbyRoom, type LobbyRoomOptions } from "./room/lobby-room.ts";

const health = createEndpoint("/health", { method: "GET" }, async () => ({ ok: true }));

/** `options` reach every room; Colyseus lets them override what a client sends. */
export function createServer(options: LobbyRoomOptions) {
  return defineServer({
    transport: new WebSocketTransport(),
    rooms: {
      [ROOM_TYPE]: defineRoom(LobbyRoom, options).filterBy(["slug"]),
    },
    routes: createRouter({ health }),
  });
}
