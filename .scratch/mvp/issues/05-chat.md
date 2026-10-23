# Chat

Status: resolved
Type: task
Blocked by: 01

## What

Room-wide messages in a chat history and as bubbles over the sender, history for late joiners, announcements and notices, and generic command parsing with names in every supported language.

See [spec](../spec.md): Chat, Layout and keyboard.

## Acceptance criteria

- [x] `packages/chat` covers message rules (1–200 characters) and command parsing (name lookup across languages, arguments), test-first.
- [x] At most 5 messages per 5 seconds per player; the excess gets a notice.
- [x] A joining player receives the last 50 messages.
- [x] Announcements for join and leave; notices for unknown commands. Both arrive as codes and render in each client's language.
- [x] `Enter` focuses the chat, `Esc` leaves it; typing never moves the player.
- [x] Bubbles never render over the screen.
