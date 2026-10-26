import { describe, expect, it } from "vitest";
import { parseTennisEvent, parseTennisNotice, TENNIS_EVENT, TENNIS_NOTICE } from "../index.ts";

describe("Tennis events and notices", () => {
  it("parses public match events as code-plus-params data", () => {
    expect(
      parseTennisEvent({
        code: "point-scored",
        params: { winnerId: "player-1", topScore: 3, bottomScore: 2 },
      }),
    ).toEqual({
      code: "point-scored",
      params: { winnerId: "player-1", topScore: 3, bottomScore: 2 },
    });
    expect(TENNIS_EVENT).toBe("tennis-event");
  });

  it("parses the private next-player notice", () => {
    expect(parseTennisNotice({ code: "you-are-next", params: { position: 1 } })).toEqual({
      code: "you-are-next",
      params: { position: 1 },
    });
    expect(TENNIS_NOTICE).toBe("tennis-notice");
  });

  it("rejects malformed server payloads", () => {
    expect(
      parseTennisEvent({ code: "point-scored", params: { winnerId: "player-1" } }),
    ).toBeUndefined();
    expect(
      parseTennisEvent({
        code: "point-scored",
        params: { winnerId: "player-1", topScore: 256, bottomScore: 0 },
      }),
    ).toBeUndefined();
    expect(
      parseTennisEvent({
        code: "point-scored",
        params: { winnerId: "player-1", topScore: -1, bottomScore: 0 },
      }),
    ).toBeUndefined();
    expect(parseTennisNotice({ code: "you-are-next", params: { position: -1 } })).toBeUndefined();
  });
});
