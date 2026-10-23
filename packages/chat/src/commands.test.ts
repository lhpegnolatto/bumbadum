import { describe, expect, it } from "vitest";
import { commands, readChatInput } from "./index.ts";

describe("commands", () => {
  it("knows /play and /tocar as the same command, with the rest as its argument", () => {
    const play = { kind: "command", command: "play", args: "https://youtu.be/dQw4w9WgXcQ" };

    expect(readChatInput("/play https://youtu.be/dQw4w9WgXcQ", commands)).toEqual(play);
    expect(readChatInput("/tocar https://youtu.be/dQw4w9WgXcQ", commands)).toEqual(play);
  });
});
