import type { CommandTable } from "./command-table.ts";

/** The most characters a message or command may have, after trimming. */
export const MESSAGE_MAX_LENGTH = 200;

const COMMAND_PREFIX = "/";

/** What a player's chat input turns out to be. */
export type ChatInput<Id extends string = string> =
  | { kind: "message"; text: string }
  | { kind: "command"; command: Id; args: string }
  | { kind: "unknown-command"; name: string }
  | { kind: "invalid"; reason: "empty" | "too-long" };

const CONTROL_CHARACTERS = /\p{Cc}/gu;
const NAME_AND_ARGS = /^(\S*)\s*(.*)$/su;

export function readChatInput<Id extends string>(
  raw: string,
  commands: CommandTable<Id>,
): ChatInput<Id> {
  // A message is one line: newlines and other control characters become spaces.
  const text = raw.replace(CONTROL_CHARACTERS, " ").trim();
  if (text.length === 0) return { kind: "invalid", reason: "empty" };
  if (text.length > MESSAGE_MAX_LENGTH) return { kind: "invalid", reason: "too-long" };
  if (!text.startsWith(COMMAND_PREFIX)) return { kind: "message", text };

  const [, name = "", args = ""] = NAME_AND_ARGS.exec(text.slice(COMMAND_PREFIX.length)) ?? [];
  const command = commands.find(name);
  return command === undefined
    ? { kind: "unknown-command", name }
    : { kind: "command", command, args };
}
