import { describe, expect, it } from "vitest";
import { AMBIENT_NPC_INTERACT_MESSAGE, parseAmbientNpcInteractIntent } from "../index.ts";

describe("Ambient NPC interaction intent", () => {
  it("accepts a known NPC id", () => {
    expect(parseAmbientNpcInteractIntent("david-bowie")).toBe("david-bowie");
    expect(parseAmbientNpcInteractIntent("elis-regina")).toBe("elis-regina");
    expect(AMBIENT_NPC_INTERACT_MESSAGE).toBe("ambient-npc-interact");
  });

  it("rejects unknown or malformed NPC ids", () => {
    expect(parseAmbientNpcInteractIntent("unknown-artist")).toBeUndefined();
    expect(parseAmbientNpcInteractIntent({ id: "david-bowie" })).toBeUndefined();
    expect(parseAmbientNpcInteractIntent(undefined)).toBeUndefined();
  });
});
