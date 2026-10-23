import {
  ANNOUNCEMENT,
  type Announcement,
  CHAT_HISTORY,
  CHAT_INPUT,
  CHAT_MESSAGE,
  type ChatHistory,
  type ChatInputPayload,
  type ChatMessage,
  NOTICE,
  type Notice,
  type RoomState,
} from "@bumbadum/protocol";
import type { Room } from "@colyseus/sdk";

/** Entries the client keeps: the joining history plus everything since, oldest dropped first. */
const ENTRY_LIMIT = 200;

type ChatItem =
  | { kind: "message"; message: ChatMessage }
  | { kind: "announcement"; announcement: Announcement }
  | { kind: "notice"; notice: Notice };

/** One line of the chat history; `id` is local, for React keys. */
export type ChatEntry = ChatItem & { id: number };

export interface ChatFeed {
  subscribe(listener: () => void): () => void;
  getEntries(): readonly ChatEntry[];
  send(text: string): void;
}

type LobbyRoom = Room<unknown, RoomState>;

const feeds = new WeakMap<LobbyRoom, ChatFeed>();

/**
 * Starts collecting the room's chat. Call it right after joining, before any
 * await: the server pushes the history on join, and the SDK drops messages
 * that arrive before a handler exists.
 */
export function watchChat(room: LobbyRoom) {
  if (!feeds.has(room)) feeds.set(room, createChatFeed(room));
}

/** The chat of a room passed to `watchChat`. */
export function chatFeedOf(room: LobbyRoom): ChatFeed {
  const feed = feeds.get(room);
  if (!feed) throw new Error("chatFeedOf: call watchChat(room) right after joining");
  return feed;
}

function createChatFeed(room: LobbyRoom): ChatFeed {
  const listeners = new Set<() => void>();
  let entries: readonly ChatEntry[] = [];
  let nextId = 0;

  function append(...added: ChatItem[]) {
    const withIds = added.map((item) => ({ ...item, id: nextId++ }));
    entries = [...entries, ...withIds].slice(-ENTRY_LIMIT);
    for (const listener of listeners) listener();
  }

  room.onMessage<ChatHistory>(CHAT_HISTORY, (history) =>
    append(...history.map((message): ChatItem => ({ kind: "message", message }))),
  );
  room.onMessage<ChatMessage>(CHAT_MESSAGE, (message) => append({ kind: "message", message }));
  room.onMessage<Announcement>(ANNOUNCEMENT, (announcement) =>
    append({ kind: "announcement", announcement }),
  );
  room.onMessage<Notice>(NOTICE, (notice) => append({ kind: "notice", notice }));

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getEntries: () => entries,
    send(text) {
      room.send(CHAT_INPUT, { text } satisfies ChatInputPayload);
    },
  };
}
