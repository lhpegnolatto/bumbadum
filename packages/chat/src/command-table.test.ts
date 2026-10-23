import { describe, expect, it } from "vitest";
import { createCommandTable } from "./index.ts";

describe("createCommandTable", () => {
  it("allows a command to share one name across languages", () => {
    const table = createCommandTable([{ id: "ok", names: { en: "ok", "pt-BR": "ok" } }]);
    expect(table.find("ok")).toBe("ok");
  });

  it("refuses a name that would point to two commands", () => {
    expect(() =>
      createCommandTable([
        { id: "wave", names: { en: "wave", "pt-BR": "acenar" } },
        { id: "greet", names: { en: "greet", "pt-BR": "Wave" } },
      ]),
    ).toThrow(/wave/i);
  });

  it("refuses a name that a player could not type as one word", () => {
    expect(() =>
      createCommandTable([{ id: "wave", names: { en: "wave hand", "pt-BR": "acenar" } }]),
    ).toThrow();
    expect(() =>
      createCommandTable([{ id: "wave", names: { en: "", "pt-BR": "acenar" } }]),
    ).toThrow();
  });
});
