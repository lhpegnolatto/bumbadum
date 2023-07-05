import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from "@nestjs/websockets";
import { Socket } from "socket.io";

type Player = {
  userId: string;
  userX: number;
  userY: number;
  avatarType: string;
  name: string;
};

type EventPayload = {
  userId: string;
  userX: number;
  userY: number;
  avatarType: string;
  name: string;
  type: "spawn" | "walk" | "stand" | "dance";
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
      const playerIndex = this.players.findIndex(
        (p) => p.userId === payload.userId
      );
      this.players.splice(playerIndex, 1, { ...payload });

      this.server.emit("event", { ...payload });
    }
  }

  handleDisconnect(client: Socket) {
    const playerIndex = this.players.findIndex((p) => p.userId === client.id);
    this.players.splice(playerIndex, 1);

    this.server.emit("event", { type: "disconnect", userId: client.id });
  }
}
