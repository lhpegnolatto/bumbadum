"use client";

import type { RoomState } from "@bumbadum/protocol";
import type { Room } from "@colyseus/sdk";
import { useSyncExternalStore } from "react";
import { chatFeedOf } from "./chat-feed.ts";
import { ChatHistory } from "./chat-history.tsx";
import { ChatInput } from "./chat-input.tsx";

/** The room's chat: the history above, the input below. Fills the height it is given. */
export function ChatPanel({ room }: { room: Room<unknown, RoomState> }) {
  const feed = chatFeedOf(room);
  const entries = useSyncExternalStore(feed.subscribe, feed.getEntries, feed.getEntries);
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-2">
      <ChatHistory entries={entries} />
      <ChatInput onSend={feed.send} />
    </section>
  );
}
