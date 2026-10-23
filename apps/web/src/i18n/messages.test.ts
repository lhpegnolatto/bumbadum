import { commands } from "@bumbadum/chat";
import { joinRejections } from "@bumbadum/protocol";
import { describe, expect, it } from "vitest";
import { locales } from "./locale.ts";
import { messages } from "./messages.ts";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("messages", () => {
  it("has the same keys in every language", () => {
    const english = keyPaths(messages.en).sort();
    for (const locale of locales) {
      expect(keyPaths(messages[locale]).sort()).toEqual(english);
    }
  });

  it("has a text for every join rejection code the server can send", () => {
    for (const locale of locales) {
      for (const code of joinRejections) {
        expect(messages[locale].joinRejection[code]).toBeTruthy();
      }
    }
  });

  it("names every language in every language", () => {
    for (const locale of locales) {
      expect(Object.keys(messages[locale].languages).sort()).toEqual([...locales].sort());
    }
  });

  it("describes every command in every language, for help and the autocomplete", () => {
    for (const locale of locales) {
      const help: Partial<Record<string, { args: string; description: string }>> =
        messages[locale].chat.commands;
      for (const command of commands.all) {
        expect(help[command.id]?.description, `${locale}: /${command.id}`).toBeTruthy();
        expect(typeof help[command.id]?.args, `${locale}: /${command.id}`).toBe("string");
      }
    }
  });
});
