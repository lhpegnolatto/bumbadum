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

  it("suggests /play for /pl in either language, and /tocar for /to", () => {
    const play = [{ command: "play", name: "play" }];

    expect(suggestCommands("/pl", "en", commands)).toEqual(play);
    expect(suggestCommands("/pl", "pt-BR", commands)).toEqual(play);
    expect(suggestCommands("/to", "pt-BR", commands)).toEqual([{ command: "play", name: "tocar" }]);
  });
});
