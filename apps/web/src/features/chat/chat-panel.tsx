"use client";

import type { RoomState } from "@bumbadum/protocol";
import type { Room } from "@colyseus/sdk";
import { useSyncExternalStore } from "react";
import { chatFeedOf } from "./chat-feed.ts";
import { ChatHistory } from "./chat-history.tsx";
import { ChatInput } from "./chat-input.tsx";

/** Chat history subscribed to the Room feed, composed separately from its input. */
export function ChatHistoryPanel({ room }: { room: Room<unknown, RoomState> }) {
  const feed = chatFeedOf(room);
  const entries = useSyncExternalStore(feed.subscribe, feed.getEntries, feed.getEntries);
  return <ChatHistory entries={entries} />;
}

export function ChatComposer({ room }: { room: Room<unknown, RoomState> }) {
  return <ChatInput onSend={chatFeedOf(room).send} />;
}
