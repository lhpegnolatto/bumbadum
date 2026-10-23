import { appendToHistory, commands, readChatInput } from "@bumbadum/chat";
import {
  ANNOUNCEMENT,
  type Announcement,
  CHAT_HISTORY,
  CHAT_MESSAGE,
  type ChatHistory,
  type ChatMessage,
  NOTICE,
  type Notice,
} from "@bumbadum/protocol";
import type { Client } from "@colyseus/core";
import { TokenBucket } from "../rate-limit/token-bucket.ts";

/** 5 chat inputs, messages or commands, per 5 seconds per player: a burst of 5, then 1 a second. */
const CHAT_RATE = { capacity: 5, perSecond: 1 };

/** The part of the room the chat talks through. */
export interface ChatRoom {
  broadcast(type: string, message: unknown): void;
}

/** A room's chat: messages, history, announcements and notices. */
export class ChatChannel {
  readonly #room: ChatRoom;
  readonly #rateLimits = new Map<string, TokenBucket>();
  #history: ChatHistory = [];

  constructor(room: ChatRoom) {
    this.#room = room;
  }

  /** Gives a joining player the recent messages and tells everyone they arrived. */
  welcome(client: Client, nickname: string, nowMs: number) {
    this.#rateLimits.set(client.sessionId, new TokenBucket(CHAT_RATE, nowMs));
    client.send(CHAT_HISTORY, this.#history);
    this.#announce({ code: "player-joined", params: { nickname } });
  }

  farewell(client: Client, nickname: string) {
    this.#rateLimits.delete(client.sessionId);
    this.#announce({ code: "player-left", params: { nickname } });
  }

  /** Handles what a player typed, already schema-validated. */
  receive(client: Client, nickname: string, text: string, nowMs: number) {
    if (!this.#rateLimits.get(client.sessionId)?.take(nowMs)) {
      notify(client, { code: "rate-limited" });
      return;
    }
    const input = readChatInput(text, commands);
    switch (input.kind) {
      case "message":
        this.#say({ senderId: client.sessionId, nickname, text: input.text });
        return;
      case "unknown-command":
        notify(client, { code: "unknown-command", params: { name: input.name } });
        return;
      case "command":
        // No commands are registered yet; radio and help wire theirs here.
        return;
      case "invalid":
        // The client never sends these; nothing to say.
        return;
    }
  }

  #say(message: ChatMessage) {
    this.#history = appendToHistory(this.#history, message);
    this.#room.broadcast(CHAT_MESSAGE, message);
  }

  #announce(announcement: Announcement) {
    this.#room.broadcast(ANNOUNCEMENT, announcement);
  }
}

function notify(client: Client, notice: Notice) {
  client.send(NOTICE, notice);
}
