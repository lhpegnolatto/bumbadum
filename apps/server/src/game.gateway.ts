import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from "@nestjs/websockets";

type EventPayload = {
  author: string;
  authorColor: string;
  message: string;
};

@WebSocketGateway({ cors: true, namespace: "game" })
export class GameGateway {
  @WebSocketServer()
  server;

  @SubscribeMessage("event")
  handleMessage(@MessageBody() payload: EventPayload): void {
    this.server.emit("event", { ...payload });
  }
}
