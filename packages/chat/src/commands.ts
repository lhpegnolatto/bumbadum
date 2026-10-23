import { type Command, createCommandTable } from "./command-table.ts";

/**
 * The command name table: every command the room understands, with its name in
 * each language. Any name works for every player. Radio and help add theirs
 * here (`/skip` | `/pular`, `/help` | `/ajuda`).
 */
const commandList = [
  { id: "play", names: { en: "play", "pt-BR": "tocar" } },
] as const satisfies readonly Command[];

export type CommandId = (typeof commandList)[number]["id"];

export const commands = createCommandTable<CommandId>(commandList);
