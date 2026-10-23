import { describe, expect, it } from "vitest";
import { createCommandTable, suggestCommands } from "./index.ts";

const commands = createCommandTable([
  { id: "wave", names: { en: "wave", "pt-BR": "acenar" } },
  { id: "dance", names: { en: "dance", "pt-BR": "dançar" } },
  { id: "ok", names: { en: "ok", "pt-BR": "ok" } },
]);

describe("suggestCommands", () => {
  it("offers every command by its name in the player's language for a lone /", () => {
    expect(suggestCommands("/", "pt-BR", commands)).toEqual([
      { command: "wave", name: "acenar" },
      { command: "dance", name: "dançar" },
      { command: "ok", name: "ok" },
    ]);
  });

  it("keeps the names that start with what was typed, ignoring case", () => {
    expect(suggestCommands("/WA", "en", commands)).toEqual([{ command: "wave", name: "wave" }]);
  });

  it("adds a name in another language once the typed prefix matches it, after the player's own", () => {
    expect(suggestCommands("/a", "en", commands)).toEqual([{ command: "wave", name: "acenar" }]);
    expect(suggestCommands("/d", "pt-BR", commands)).toEqual([
      { command: "dance", name: "dançar" },
      { command: "dance", name: "dance" },
    ]);
  });

  it("offers a name shared by two languages once", () => {
    expect(suggestCommands("/o", "en", commands)).toEqual([{ command: "ok", name: "ok" }]);
  });

  it("offers nothing once the name is complete, or for anything but a name being typed", () => {
    expect(suggestCommands("/wave", "en", commands)).toEqual([]);
    expect(suggestCommands("/Acenar", "en", commands)).toEqual([]);
    expect(suggestCommands("/wa hi", "en", commands)).toEqual([]);
    expect(suggestCommands("/ ", "en", commands)).toEqual([]);
    expect(suggestCommands("wa", "en", commands)).toEqual([]);
    expect(suggestCommands("", "en", commands)).toEqual([]);
  });
});
