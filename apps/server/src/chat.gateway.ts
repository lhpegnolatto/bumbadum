import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from "@nestjs/websockets";

type MessagePayload = {
  author: string;
  authorColor: string;
  message: string;
};

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server;

  @SubscribeMessage("message")
  handleMessage(@MessageBody() payload: MessagePayload): void {
    this.server.emit("message", { ...payload, sendedAt: new Date() });
  }
}
