import { describe, expect, it } from "vitest";
import { createCommandTable, readChatInput } from "./index.ts";

const noCommands = createCommandTable([]);

const commands = createCommandTable([
  { id: "wave", names: { en: "wave", "pt-BR": "acenar" } },
  { id: "dance", names: { en: "dance", "pt-BR": "dançar" } },
]);

describe("readChatInput: commands", () => {
  it("reads a leading / as a command, with everything after its name as arguments", () => {
    expect(readChatInput("/wave", commands)).toEqual({
      kind: "command",
      command: "wave",
      args: "",
    });
    expect(readChatInput("/dance  slowly  please ", commands)).toEqual({
      kind: "command",
      command: "dance",
      args: "slowly  please",
    });
  });

  it("knows a command by its name in every language, whatever the player's language", () => {
    expect(readChatInput("/acenar oi", commands)).toEqual({
      kind: "command",
      command: "wave",
      args: "oi",
    });
    expect(readChatInput("/dançar", commands)).toMatchObject({ command: "dance" });
  });

  it("ignores the case of the name", () => {
    expect(readChatInput("/WAVE", commands)).toMatchObject({ command: "wave" });
    expect(readChatInput("/Acenar", commands)).toMatchObject({ command: "wave" });
  });

  it("reports an unknown command with the name as typed", () => {
    expect(readChatInput("/Fly away", commands)).toEqual({ kind: "unknown-command", name: "Fly" });
    expect(readChatInput("/", commands)).toEqual({ kind: "unknown-command", name: "" });
  });

  it("applies the message rules to commands too", () => {
    expect(readChatInput(`/wave ${"a".repeat(200)}`, commands)).toEqual({
      kind: "invalid",
      reason: "too-long",
    });
  });
});

describe("readChatInput: messages", () => {
  it("reads text as a message, trimmed", () => {
    expect(readChatInput("  hello there  ", noCommands)).toEqual({
      kind: "message",
      text: "hello there",
    });
  });

  it("refuses an empty or blank input", () => {
    expect(readChatInput("", noCommands)).toEqual({ kind: "invalid", reason: "empty" });
    expect(readChatInput("   ", noCommands)).toEqual({ kind: "invalid", reason: "empty" });
  });

  it("turns control characters such as newlines into spaces", () => {
    expect(readChatInput("one\ntwo\tthree\u0000four", noCommands)).toEqual({
      kind: "message",
      text: "one two three four",
    });
    expect(readChatInput("\n\r\t", noCommands)).toEqual({ kind: "invalid", reason: "empty" });
  });

  it("accepts up to 200 characters and refuses more, counted after trimming", () => {
    const longest = "a".repeat(200);
    expect(readChatInput(`  ${longest}  `, noCommands)).toEqual({
      kind: "message",
      text: longest,
    });
    expect(readChatInput("a".repeat(201), noCommands)).toEqual({
      kind: "invalid",
      reason: "too-long",
    });
  });
});
