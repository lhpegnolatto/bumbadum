import { MESSAGE_MAX_LENGTH } from "@bumbadum/chat";
import { z } from "zod";

/** Client → server: what a player typed in the chat, a message or a command. */
export const CHAT_INPUT = "chat-input";

/** Bounds the payload only; the chat domain decides what the text means. */
export const chatInputSchema = z.object({
  text: z.string().max(MESSAGE_MAX_LENGTH),
});
export type ChatInputPayload = z.infer<typeof chatInputSchema>;

/** Server → every client: a player's message. Never translated (ADR-0009). */
export const CHAT_MESSAGE = "chat-message";

export interface ChatMessage {
  /** The sender's session id, to place the bubble over their avatar. */
  senderId: string;
  nickname: string;
  text: string;
}

/** Server → a joining client: the last messages kept in memory, oldest first. */
export const CHAT_HISTORY = "chat-history";
export type ChatHistory = ChatMessage[];
