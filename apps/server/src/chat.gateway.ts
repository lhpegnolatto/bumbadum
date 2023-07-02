import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from "@nestjs/websockets";
import { lastValueFrom, map } from "rxjs";

type MessagePayload = {
  author: string;
  authorColor: string;
  message: string;
  music: {
    videoId: string;
    title: string;
    thumb: string;
    channel: string;
  };
};

@Injectable()
@WebSocketGateway({ cors: true, namespace: "chat" })
export class ChatGateway {
  constructor(private readonly httpService: HttpService) {}

  @WebSocketServer()
  server;

  @SubscribeMessage("message")
  async handleMessage(@MessageBody() payload: MessagePayload): Promise<void> {
    // AIzaSyAFUnYXG_Y7pbIfViHTuGDGJuzrra-SeA0 -- YouTube API KEY --

    const query = payload.message.includes("/play")
      ? payload.message.split("/play")[1]
      : "";

    if (query) {
      const request = this.httpService
        .get(
          `https://youtube.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&key=AIzaSyAFUnYXG_Y7pbIfViHTuGDGJuzrra-SeA0`
        )
        .pipe(
          map((res) => {
            return res.data;
          })
        );

      const response = await lastValueFrom(request);

      const videoId = response?.items[0].id.videoId;
      const title = response?.items[0].snippet.title;
      const thumb = response?.items[0].snippet.thumbnails.default.url;
      const channelId = response?.items[0].snippet.channelId;

      const channelRequest = this.httpService
        .get(
          `https://www.googleapis.com/youtube/v3/channels?id=${channelId}&part=snippet&key=AIzaSyAFUnYXG_Y7pbIfViHTuGDGJuzrra-SeA0`
        )
        .pipe(
          map((res) => {
            return res.data;
          })
        );

      const channelResponse = await lastValueFrom(channelRequest);

      const channelTitle = channelResponse?.items[0].snippet.title;

      this.server.emit("message", {
        ...payload,
        sendedAt: new Date(),
        music: {
          videoId,
          title,
          thumb,
          channel: channelTitle,
        },
      });
    } else {
      this.server.emit("message", { ...payload, sendedAt: new Date() });
    }
  }
}
