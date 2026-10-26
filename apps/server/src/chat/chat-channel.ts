import { appendToHistory, type CommandId, commands, readChatInput } from "@bumbadum/chat";
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

/** Runs a command a player typed; the room wires each one to its domain. */
export type CommandHandler = (client: Client, nickname: string, args: string) => void;

/** The commands the room wires; the chat answers `/help` itself. */
export type RoomCommandId = Exclude<CommandId, "help">;

/** A room's chat: messages, history, announcements and notices. */
export class ChatChannel {
  readonly #room: ChatRoom;
  readonly #commands: Readonly<Record<RoomCommandId, CommandHandler>>;
  readonly #rateLimits = new Map<string, TokenBucket>();
  #history: ChatHistory = [];

  constructor(room: ChatRoom, commandHandlers: Readonly<Record<RoomCommandId, CommandHandler>>) {
    this.#room = room;
    this.#commands = commandHandlers;
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

  /** Tells everyone a player now goes by another Nickname. Earlier messages keep the old one. */
  renamed(from: string, to: string) {
    this.#announce({ code: "player-renamed", params: { from, to } });
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
        if (input.command === "help") notify(client, { code: "help" });
        else this.#commands[input.command](client, nickname, input.args);
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
