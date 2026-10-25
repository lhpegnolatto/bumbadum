import { COMMAND_PREFIX } from "./chat-input.ts";
import {
  type CommandTable,
  type Language,
  languages,
  normalizeCommandName,
} from "./command-table.ts";

/** A command name a player could be typing, in one of the languages. */
export interface CommandSuggestion<Id extends string = string> {
  command: Id;
  name: string;
}

const NAME_BEING_TYPED = /^\S*$/u;

/**
 * The command names that complete what a player has typed so far: the names
 * in their language first, then names in other languages that the typed
 * prefix matches. A lone `/` matches only names in their language. Nothing
 * once the name is complete or arguments have started.
 */
export function suggestCommands<Id extends string>(
  draft: string,
  language: Language,
  commands: CommandTable<Id>,
): CommandSuggestion<Id>[] {
  if (!draft.startsWith(COMMAND_PREFIX)) return [];
  const typed = normalizeCommandName(draft.slice(COMMAND_PREFIX.length));
  if (!NAME_BEING_TYPED.test(typed) || commands.find(typed) !== undefined) return [];

  const searched =
    typed === "" ? [language] : [language, ...languages.filter((other) => other !== language)];
  const suggestions: CommandSuggestion<Id>[] = [];
  const offered = new Set<string>();
  for (const searchedLanguage of searched) {
    for (const command of commands.all) {
      const name = command.names[searchedLanguage];
      const normalized = normalizeCommandName(name);
      if (!normalized.startsWith(typed) || offered.has(normalized)) continue;
      offered.add(normalized);
      suggestions.push({ command: command.id, name });
    }
  }
  return suggestions;
}
