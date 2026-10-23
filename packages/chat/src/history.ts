/** How many recent messages the room keeps for players who join later. */
export const HISTORY_LENGTH = 50;

/** Returns the history with `message` added last, dropping the oldest beyond the limit. */
export function appendToHistory<Message>(history: readonly Message[], message: Message): Message[] {
  return [...history, message].slice(-HISTORY_LENGTH);
}
