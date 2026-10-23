# Help

Status: resolved
Type: task
Blocked by: 08

## What

Command discovery: the hint under the chat input, `/help` | `/ajuda`, and the autocomplete on `/`.

See [spec](../spec.md): Help.

## Acceptance criteria

- [x] The hint lists the commands in the UI language.
- [x] `/help` | `/ajuda` replies with a notice listing the commands in the asker's language.
- [x] Typing `/` shows the command names in the UI language; a prefix matching a name in another language shows that one too.

## Comments

Built and tested. Notes for later work:

- `/help` | `/ajuda` is in the command table (`packages/chat/src/commands.ts`). `ChatChannel` answers it itself with the `help` notice, a code with no params; the room wires only the other commands (`RoomCommandId`).
- The client builds the help notice, the hint under the input and the autocomplete from `commands.all`: names from the table, the argument hint and description from `chat.commands.<id>` in `en.json` / `pt-BR.json` (`args` is empty for a command that takes none). A new command shows up everywhere once it has those strings; `messages.test.ts` fails until it does.
- The matching is `suggestCommands` in `packages/chat`: names in the UI language first, then other languages' names that the typed prefix matches (a lone `/` shows only the UI language), ignoring case, and nothing once the name is complete or arguments have started. So Enter on `/skip` or `/play <link>` sends, while Enter on `/pl` completes.
- The autocomplete is a hand-rolled listbox (`apps/web/src/features/chat/chat-input.tsx`): the input is the combobox and keeps the focus (`aria-activedescendant`). Esc closes the list before it leaves the chat, and so does leaving the input.
- `joinLobby` takes `{ locale: "pt-BR" }` for a Portuguese browser.
