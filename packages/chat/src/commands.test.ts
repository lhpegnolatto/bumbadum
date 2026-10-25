import { describe, expect, it } from "vitest";
import { commands, readChatInput, suggestCommands } from "./index.ts";

describe("commands", () => {
  it("knows /play and /tocar as the same command, with the rest as its argument", () => {
    const play = { kind: "command", command: "play", args: "https://youtu.be/dQw4w9WgXcQ" };

    expect(readChatInput("/play https://youtu.be/dQw4w9WgXcQ", commands)).toEqual(play);
    expect(readChatInput("/tocar https://youtu.be/dQw4w9WgXcQ", commands)).toEqual(play);
  });

  it("knows /skip and /pular as the same command", () => {
    const skip = { kind: "command", command: "skip", args: "" };

    expect(readChatInput("/skip", commands)).toEqual(skip);
    expect(readChatInput("/PULAR", commands)).toEqual(skip);
  });

  it("knows /help and /ajuda as the same command", () => {
    const help = { kind: "command", command: "help", args: "" };

    expect(readChatInput("/help", commands)).toEqual(help);
    expect(readChatInput("/ajuda", commands)).toEqual(help);
  });

  it("knows /dance, /dançar and /dancar as the same command: names match without accents", () => {
    const dance = { kind: "command", command: "dance", args: "" };

    expect(readChatInput("/dance", commands)).toEqual(dance);
    expect(readChatInput("/dançar", commands)).toEqual(dance);
    expect(readChatInput("/dancar", commands)).toEqual(dance);
    expect(readChatInput("/DANÇAR", commands)).toEqual(dance);
  });

  it("knows /confetti and /confete as the same command", () => {
    const confetti = { kind: "command", command: "confetti", args: "" };

    expect(readChatInput("/confetti", commands)).toEqual(confetti);
    expect(readChatInput("/Confete", commands)).toEqual(confetti);
  });

  it("suggests /dançar, then /dance, for /danc typed without the cedilla", () => {
    expect(suggestCommands("/danc", "pt-BR", commands)).toEqual([
      { command: "dance", name: "dançar" },
      { command: "dance", name: "dance" },
    ]);
  });

  it("suggests /play for /pl in either language, and /tocar for /to", () => {
    const play = [{ command: "play", name: "play" }];

    expect(suggestCommands("/pl", "en", commands)).toEqual(play);
    expect(suggestCommands("/pl", "pt-BR", commands)).toEqual(play);
    expect(suggestCommands("/to", "pt-BR", commands)).toEqual([{ command: "play", name: "tocar" }]);
  });
});
