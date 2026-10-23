import { type Command, createCommandTable } from "./command-table.ts";

/**
 * The command name table: every command the room understands, with its name in
 * each language, in the order help lists them. Any name works for every player.
 */
const commandList = [
  { id: "play", names: { en: "play", "pt-BR": "tocar" } },
  { id: "skip", names: { en: "skip", "pt-BR": "pular" } },
  { id: "help", names: { en: "help", "pt-BR": "ajuda" } },
] as const satisfies readonly Command[];

export type CommandId = (typeof commandList)[number]["id"];

export const commands = createCommandTable<CommandId>(commandList);
