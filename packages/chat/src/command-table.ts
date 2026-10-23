/** The languages every command has a name in (ADR-0009). */
export const languages = ["en", "pt-BR"] as const;
export type Language = (typeof languages)[number];

/** A command the room understands, with its name in each supported language. */
export interface Command<Id extends string = string> {
  id: Id;
  names: Readonly<Record<Language, string>>;
}

export interface CommandTable<Id extends string = string> {
  /** Every command, in the order help lists them. */
  readonly all: readonly Command<Id>[];
  /** Finds a command by any of its names, in any language. */
  find(name: string): Id | undefined;
}

const ONE_WORD = /^[^\s/]+$/u;

/** Throws when a name is not one word or points to two commands: both are programming errors. */
export function createCommandTable<Id extends string>(
  commands: readonly Command<Id>[],
): CommandTable<Id> {
  const byName = new Map<string, Id>();
  for (const command of commands) {
    for (const name of Object.values(command.names)) {
      if (!ONE_WORD.test(name)) {
        throw new Error(`Command "${command.id}" has a name that is not one word: "${name}"`);
      }
      const owner = byName.get(normalize(name));
      if (owner !== undefined && owner !== command.id) {
        throw new Error(`Commands "${owner}" and "${command.id}" share the name "${name}"`);
      }
      byName.set(normalize(name), command.id);
    }
  }
  return {
    all: commands,
    find: (name) => byName.get(normalize(name)),
  };
}

function normalize(name: string): string {
  return name.toLowerCase();
}
