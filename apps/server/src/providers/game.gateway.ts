import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from "@nestjs/websockets";
import { Socket } from "socket.io";

type Avatar = {
  skin: number;
  hair: { type: number; color: number };
  top: { type: number; color: number };
  bottom: { type: number; color: number };
  footwear: { type: number; color: number };
}

type Player = {
  id: string;
  name: string;
  x: number;
  y: number;
  avatar: Avatar
};

type EventType = "spawn" | "walk" | "stand" | "dance";

type EventPayload = {
  id: string;
  x: number;
  y: number;
  avatar: Avatar;
  name: string;
  type: EventType;
};

@WebSocketGateway({ cors: true, namespace: "game" })
export class GameGateway {
  players = [] as Player[];

  @WebSocketServer()
  server;

  @SubscribeMessage("event")
  handleMessage(@MessageBody() payload: EventPayload): void {
    if (payload.type === "spawn") {
      this.players.push({ ...payload });

      this.server.emit("event", { type: "spawn", players: this.players });
    } else {
      const playerIndex = this.players.findIndex((p) => p.id === payload.id);
      this.players.splice(playerIndex, 1, {
        ...this.players[playerIndex],
        ...payload,
      });

      this.server.emit("event", { ...payload });
    }
  }

  handleDisconnect(client: Socket) {
    const playerIndex = this.players.findIndex((p) => p.id === client.id);
    this.players.splice(playerIndex, 1);

    this.server.emit("event", { type: "disconnect", id: client.id });
  }
}
