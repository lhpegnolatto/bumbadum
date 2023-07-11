import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from "@nestjs/websockets";
import { lastValueFrom, map } from "rxjs";

type YoutubeMusic = {
  videoId: string;
  title: string;
  thumb: string;
  channel: string;
};

type MessagePayload = {
  author: string;
  authorColor: string;
  message: string;
  music: YoutubeMusic;
};

@Injectable()
@WebSocketGateway({ cors: true, namespace: "chat" })
export class ChatGateway {
  constructor(private readonly httpService: HttpService) {}

  @WebSocketServer()
  server;

  async handleGetYoutubeVideoByQuery(query: string): Promise<YoutubeMusic> {
    console.log(process.env.YOUTUBE_DATA_API_KEY);

    const searchRequest = this.httpService
      .get("https://youtube.googleapis.com/youtube/v3/search", {
        params: {
          q: query,
          type: "video",
          part: "snippet",
          key: process.env.YOUTUBE_DATA_API_KEY,
        },
      })
      .pipe(
        map((res) => {
          return res.data;
        })
      );

    const searchResponse = await lastValueFrom(searchRequest);

    const videoId = searchResponse?.items[0].id.videoId;
    const title = searchResponse?.items[0].snippet.title;
    const thumb = searchResponse?.items[0].snippet.thumbnails.default.url;
    const channelId = searchResponse?.items[0].snippet.channelId;

    const channelRequest = this.httpService
      .get("https://www.googleapis.com/youtube/v3/channels", {
        params: {
          id: channelId,
          part: "snippet",
          key: process.env.YOUTUBE_DATA_API_KEY,
        },
      })
      .pipe(
        map((res) => {
          return res.data;
        })
      );

    const channelResponse = await lastValueFrom(channelRequest);

    const channelTitle = channelResponse?.items[0].snippet.title;

    return {
      videoId,
      title,
      thumb,
      channel: channelTitle,
    };
  }

  @SubscribeMessage("message")
  async handleMessage(@MessageBody() payload: MessagePayload): Promise<void> {
    const query = payload.message.includes("/play")
      ? payload.message.split("/play")[1]
      : "";

    if (query) {
      const music = await this.handleGetYoutubeVideoByQuery(query);

      this.server.emit("message", {
        ...payload,
        sendedAt: new Date(),
        music,
      });
    } else {
      this.server.emit("message", { ...payload, sendedAt: new Date() });
    }
  }
}
