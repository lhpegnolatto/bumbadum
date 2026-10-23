import { describe, expect, it } from "vitest";
import {
  type Radio,
  recountSkipVotes,
  type Submission,
  type Submitter,
  silentRadio,
  skipTally,
  submit,
  type TrackInfo,
  voteToSkip,
} from "./index.ts";

const MINUTE = 60_000;

const ana: Submitter = { id: "ana", nickname: "Ana" };
const bia: Submitter = { id: "bia", nickname: "Bia" };

function info(videoId: string): TrackInfo {
  return {
    videoId,
    title: `Title of ${videoId}`,
    durationMs: 3 * MINUTE,
    embeddable: true,
    live: false,
  };
}

function accepted(submission: Submission) {
  if (submission.kind !== "accepted") throw new Error(`refused: ${submission.reason}`);
  return submission;
}

/** Ana's track on air, Bia's waiting behind it, both submitted at 0. */
function anaOnAirBiaNext(): Radio {
  const radio = accepted(submit(silentRadio, info("aaaaaaaaaaa"), ana, 0)).radio;
  return accepted(submit(radio, info("bbbbbbbbbbb"), bia, 0)).radio;
}

const onAir = (radio: Radio) => radio.nowPlaying?.track.videoId;

describe("voteToSkip", () => {
  it("counts a vote from a player who is not the submitter, against more than half of those present", () => {
    const outcome = voteToSkip(anaOnAirBiaNext(), "bia", ["ana", "bia", "cris", "duda"], MINUTE);

    expect(outcome).toMatchObject({ kind: "counted", tally: { votes: 1, needed: 3 } });
    if (outcome.kind !== "counted") throw new Error(outcome.kind);
    expect(onAir(outcome.radio)).toBe("aaaaaaaaaaa");
    expect(skipTally(outcome.radio, ["ana", "bia", "cris", "duda"])).toEqual({
      votes: 1,
      needed: 3,
    });
  });

  it("skips the track once more than half of those present have voted, the next one starting now", () => {
    const present = ["ana", "bia", "cris"];
    const first = voteToSkip(anaOnAirBiaNext(), "bia", present, MINUTE);
    if (first.kind !== "counted") throw new Error(first.kind);
    const outcome = voteToSkip(first.radio, "cris", present, MINUTE + 500);

    if (outcome.kind !== "skipped") throw new Error(outcome.kind);
    expect(outcome.radio.nowPlaying).toMatchObject({
      track: { videoId: "bbbbbbbbbbb" },
      startedAt: MINUTE + 500,
    });
    expect(outcome.radio.queue).toEqual([]);
    expect(skipTally(outcome.radio, present)).toEqual({ votes: 0, needed: 2 });
    expect(outcome.events).toEqual([
      { kind: "skipped", track: expect.objectContaining({ videoId: "aaaaaaaaaaa" }) },
      { kind: "on-air", nowPlaying: outcome.radio.nowPlaying },
    ]);
  });

  it("skips at once when the submitter votes, however many are present", () => {
    const outcome = voteToSkip(anaOnAirBiaNext(), "ana", ["ana", "bia", "cris", "duda"], MINUTE);

    expect(outcome.kind).toBe("skipped");
    if (outcome.kind !== "skipped") return;
    expect(onAir(outcome.radio)).toBe("bbbbbbbbbbb");
  });

  it("counts a second vote from the same player once", () => {
    const present = ["ana", "bia", "cris", "duda"];
    const first = voteToSkip(anaOnAirBiaNext(), "bia", present, MINUTE);
    if (first.kind !== "counted") throw new Error(first.kind);

    expect(voteToSkip(first.radio, "bia", present, MINUTE)).toEqual({
      kind: "already-voted",
      tally: { votes: 1, needed: 3 },
    });
  });

  it("has nothing to skip when nothing is on air, also once the last track has ended", () => {
    expect(voteToSkip(silentRadio, "bia", ["bia"], 0)).toEqual({ kind: "nothing-on-air" });
    const ended = accepted(submit(silentRadio, info("aaaaaaaaaaa"), ana, 0)).radio;
    expect(voteToSkip(ended, "bia", ["ana", "bia"], 3 * MINUTE)).toEqual({
      kind: "nothing-on-air",
    });
  });

  it("starts every track with no votes, also one that went on air by the clock", () => {
    const present = ["ana", "bia", "cris", "duda"];
    const first = voteToSkip(anaOnAirBiaNext(), "cris", present, MINUTE);
    if (first.kind !== "counted") throw new Error(first.kind);

    const outcome = voteToSkip(first.radio, "duda", present, 3 * MINUTE + 1);

    expect(outcome).toMatchObject({ kind: "counted", tally: { votes: 1, needed: 3 } });
    if (outcome.kind !== "counted") return;
    expect(onAir(outcome.radio)).toBe("bbbbbbbbbbb");
    expect(outcome.radio.skipVotes).toEqual(["duda"]);
    expect(outcome.events.map((event) => event.kind)).toEqual(["on-air"]);
  });
});

describe("recountSkipVotes", () => {
  /** Cris and Duda voted against Ana's track with four present: 2 of the 3 needed. */
  function twoOfFourVoted(): Radio {
    const present = ["ana", "bia", "cris", "duda"];
    const first = voteToSkip(anaOnAirBiaNext(), "cris", present, MINUTE);
    if (first.kind !== "counted") throw new Error(first.kind);
    const second = voteToSkip(first.radio, "duda", present, MINUTE);
    if (second.kind !== "counted") throw new Error(second.kind);
    return second.radio;
  }

  it("drops the vote of a player who left", () => {
    const recounted = recountSkipVotes(twoOfFourVoted(), ["ana", "bia", "cris"], MINUTE);

    expect(recounted.events).toEqual([]);
    expect(recounted.radio.skipVotes).toEqual(["cris"]);
    expect(skipTally(recounted.radio, ["ana", "bia", "cris"])).toEqual({ votes: 1, needed: 2 });
  });

  it("skips when a player leaves and those who voted are now more than half", () => {
    const recounted = recountSkipVotes(twoOfFourVoted(), ["ana", "cris", "duda"], MINUTE + 10);

    expect(recounted.events.map((event) => event.kind)).toEqual(["skipped", "on-air"]);
    expect(recounted.radio.nowPlaying).toMatchObject({
      track: { videoId: "bbbbbbbbbbb" },
      startedAt: MINUTE + 10,
    });
  });

  it("only raises the votes needed when a player joins", () => {
    const first = voteToSkip(anaOnAirBiaNext(), "cris", ["ana", "bia", "cris"], MINUTE);
    if (first.kind !== "counted") throw new Error(first.kind);
    const present = ["ana", "bia", "cris", "duda", "eva"];

    const recounted = recountSkipVotes(first.radio, present, MINUTE);

    expect(recounted).toEqual({ radio: first.radio, events: [] });
    expect(skipTally(recounted.radio, present)).toEqual({ votes: 1, needed: 3 });
  });

  it("never skips a track because the room emptied", () => {
    const first = voteToSkip(anaOnAirBiaNext(), "cris", ["ana", "bia", "cris"], MINUTE);
    if (first.kind !== "counted") throw new Error(first.kind);

    const recounted = recountSkipVotes(first.radio, [], MINUTE);

    expect(onAir(recounted.radio)).toBe("aaaaaaaaaaa");
    expect(recounted.events).toEqual([]);
  });
});
