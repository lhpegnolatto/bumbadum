import { describe, expect, it } from "vitest";
import {
  attemptRebound,
  createTennisLine,
  DEFAULT_TENNIS_RULES,
  joinTennisLine,
  leaveTennisLine,
  type Rally,
  type RandomSource,
  startNextTennisMatch,
  type TennisMatch,
} from "./index.ts";

const rules = {
  ...DEFAULT_TENNIS_RULES,
  court: {
    ...DEFAULT_TENNIS_RULES.court,
    singlesMinX: 64,
    singlesMaxX: 272,
    tileSize: 16,
    targetMarginTiles: 1,
  },
  initialBallSpeed: 96,
  contactToleranceTiles: 1,
};

function sequenceRandom(...values: number[]): RandomSource {
  let index = 0;

  return {
    next() {
      const value = values[index % values.length];
      index += 1;
      return value ?? 0;
    },
  };
}

function lineWithPlayers(...playerIds: string[]) {
  let line = createTennisLine(playerIds.length + 2);
  for (const playerId of playerIds) {
    line = joinTennisLine(line, playerId).line;
  }
  return line;
}

function startMatch(...playerIds: string[]) {
  const result = startNextTennisMatch(
    lineWithPlayers(...playerIds),
    sequenceRandom(0.9, 0, 0),
    rules,
  );
  expect(result.match).not.toBeNull();
  if (result.match === null) {
    throw new Error("expected a match");
  }
  return result.match;
}

function activeRally(match: TennisMatch): Rally {
  if (match.rally === null) {
    throw new Error("expected an active Rally");
  }
  return match.rally;
}

describe("Tennis line", () => {
  it("starts new points at the tuned faster default ball speed", () => {
    const result = startNextTennisMatch(lineWithPlayers("alice", "bob"), sequenceRandom(0, 0, 0));

    expect(result.match?.rally?.speed).toBe(128);
  });

  it("keeps FIFO order, makes joining idempotent, and respects its capacity", () => {
    let line = createTennisLine(2);

    expect(joinTennisLine(line, "alice")).toMatchObject({ status: "joined", position: 0 });
    line = joinTennisLine(line, "alice").line;
    line = joinTennisLine(line, "bob").line;

    expect(joinTennisLine(line, "alice")).toMatchObject({
      status: "already-joined",
      position: 0,
    });
    expect(joinTennisLine(line, "carol")).toMatchObject({ status: "full", position: null });
    expect(line.playerIds).toEqual(["alice", "bob"]);

    line = leaveTennisLine(line, "alice");
    expect(line.playerIds).toEqual(["bob"]);
    expect(leaveTennisLine(line, "alice")).toBe(line);
  });
});

describe("Tennis match", () => {
  it("starts with deterministic sides, server, and a singles target", () => {
    const line = lineWithPlayers("alice", "bob");
    const result = startNextTennisMatch(line, sequenceRandom(0.9, 0.1, 0.5), rules);

    expect(result.line.playerIds).toEqual([]);
    expect(result.match).toMatchObject({
      playerBySide: { top: "bob", bottom: "alice" },
      servingSide: "top",
      score: { alice: 0, bob: 0 },
    });
    expect(result.match?.rally).toMatchObject({
      fromSide: "top",
      receivingSide: "bottom",
      targetX: 176,
      speed: 96,
      reboundCount: 0,
    });
  });

  it("chooses the edge targets inside singles boundaries with the configured margin", () => {
    const low = startNextTennisMatch(
      lineWithPlayers("alice", "bob"),
      sequenceRandom(0, 0, 0),
      rules,
    ).match;
    const high = startNextTennisMatch(
      lineWithPlayers("alice", "bob"),
      sequenceRandom(0, 0, 0.999),
      rules,
    ).match;

    if (low === null || high === null) {
      throw new Error("expected both matches to start");
    }
    expect(activeRally(low).targetX).toBe(80);
    expect(activeRally(high).targetX).toBe(256);
  });

  it("increases speed by 10 percent per rebound and caps it at twice the point speed", () => {
    let match = startMatch("alice", "bob");

    for (let rebound = 1; rebound <= 20; rebound += 1) {
      const rally = activeRally(match);
      const result = attemptRebound(
        match,
        rally.receivingSide,
        rally.targetX,
        sequenceRandom(0),
        rules,
      );
      expect(result.outcome).toBe("rebounded");
      match = result.match;
    }

    expect(activeRally(match).speed).toBe(192);
    expect(activeRally(match).reboundCount).toBe(20);
  });

  it("uses the configured one-tile contact tolerance", () => {
    const match = startMatch("alice", "bob");
    const rally = activeRally(match);
    const hit = attemptRebound(
      match,
      rally.receivingSide,
      rally.targetX + rules.court.tileSize,
      sequenceRandom(0),
      rules,
    );
    const miss = attemptRebound(
      match,
      rally.receivingSide,
      rally.targetX + rules.court.tileSize + 1,
      sequenceRandom(0),
      rules,
    );

    expect(hit.outcome).toBe("rebounded");
    expect(miss.outcome).toBe("missed");
  });

  it("awards a point for a miss and starts the next rally at its initial speed", () => {
    const match = startMatch("alice", "bob");
    const rally = activeRally(match);
    const result = attemptRebound(
      match,
      rally.receivingSide,
      rally.targetX + rules.court.tileSize * 2,
      sequenceRandom(0),
      rules,
    );

    expect(result).toMatchObject({
      outcome: "missed",
      pointWonBy: "bob",
      match: {
        score: { alice: 0, bob: 1 },
        servingSide: "bottom",
        rally: { speed: 96, reboundCount: 0, fromSide: "bottom", receivingSide: "top" },
      },
    });
  });

  it("ends at five points for the first player to reach the target", () => {
    let match = startMatch("alice", "bob");

    for (let point = 1; point <= 5; point += 1) {
      let rally = activeRally(match);
      const receivingPlayer = match.playerBySide[rally.receivingSide];
      if (receivingPlayer === "bob") {
        const hit = attemptRebound(
          match,
          rally.receivingSide,
          rally.targetX,
          sequenceRandom(0),
          rules,
        );
        expect(hit.outcome).toBe("rebounded");
        match = hit.match;
        rally = activeRally(match);
      }

      const result = attemptRebound(
        match,
        rally.receivingSide,
        rally.targetX + rules.court.tileSize * 2,
        sequenceRandom(0),
        rules,
      );
      expect(result.outcome).toBe(point === 5 ? "match-complete" : "missed");
      match = result.match;
    }

    expect(match.status).toBe("complete");
    expect(match.winner).toBe("bob");
    expect(match.score).toEqual({ alice: 0, bob: 5 });
    expect(match.rally).toBeNull();
  });
});
