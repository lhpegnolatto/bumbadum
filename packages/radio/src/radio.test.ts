import { describe, expect, it } from "vitest";
import {
  advance,
  endsAt,
  type Radio,
  refusalBeforeLookup,
  type Submission,
  type Submitter,
  silentRadio,
  submit,
  type TrackInfo,
} from "./index.ts";

const MINUTE = 60_000;

const ana: Submitter = { id: "ana-session", nickname: "Ana" };
const bia: Submitter = { id: "bia-session", nickname: "Bia" };

function info(videoId: string, overrides: Partial<TrackInfo> = {}): TrackInfo {
  return {
    videoId,
    title: `Title of ${videoId}`,
    durationMs: 3 * MINUTE,
    embeddable: true,
    live: false,
    ...overrides,
  };
}

function accepted(submission: Submission) {
  if (submission.kind !== "accepted") throw new Error(`refused: ${submission.reason}`);
  return submission;
}

/** Submits every video in order, by `submitter`, at `now`. */
function radioWith(videoIds: string[], submitter = ana, now = 0): Radio {
  let radio = silentRadio;
  for (const videoId of videoIds)
    radio = accepted(submit(radio, info(videoId), submitter, now)).radio;
  return radio;
}

const onAir = (radio: Radio) => radio.nowPlaying?.track.videoId;
const waiting = (radio: Radio) => radio.queue.map((track) => track.videoId);

describe("submit", () => {
  it("puts a track straight on air when the radio is silent, starting now", () => {
    const submission = accepted(submit(silentRadio, info("aaaaaaaaaaa"), ana, 5000));

    expect(submission.radio.nowPlaying).toEqual({
      track: {
        videoId: "aaaaaaaaaaa",
        title: "Title of aaaaaaaaaaa",
        durationMs: 3 * MINUTE,
        submitter: ana,
      },
      startedAt: 5000,
    });
    expect(submission.radio.queue).toEqual([]);
    expect(submission.events.map((event) => event.kind)).toEqual(["queued", "on-air"]);
  });

  it("queues tracks behind the one on air, first in first out", () => {
    const radio = radioWith(["aaaaaaaaaaa", "bbbbbbbbbbb", "ccccccccccc"]);

    expect(onAir(radio)).toBe("aaaaaaaaaaa");
    expect(waiting(radio)).toEqual(["bbbbbbbbbbb", "ccccccccccc"]);
  });

  it("announces a queued track with its submitter", () => {
    const submission = accepted(submit(radioWith(["aaaaaaaaaaa"]), info("bbbbbbbbbbb"), bia, 0));

    expect(submission.events).toEqual([
      {
        kind: "queued",
        track: expect.objectContaining({ videoId: "bbbbbbbbbbb", submitter: bia }),
      },
    ]);
  });

  describe("refuses", () => {
    const radio = radioWith(["aaaaaaaaaaa", "bbbbbbbbbbb"]);
    const refusal = (submission: Submission) =>
      submission.kind === "refused" ? submission.reason : "accepted";

    it("a live stream, including an upcoming one", () => {
      expect(
        refusal(submit(radio, info("ccccccccccc", { live: true, durationMs: 0 }), bia, 0)),
      ).toBe("live");
    });

    it("a video that cannot be embedded", () => {
      expect(refusal(submit(radio, info("ccccccccccc", { embeddable: false }), bia, 0))).toBe(
        "not-embeddable",
      );
    });

    it("a track longer than 10 minutes, but not one of exactly 10", () => {
      expect(
        refusal(submit(radio, info("ccccccccccc", { durationMs: 10 * MINUTE + 1 }), bia, 0)),
      ).toBe("too-long");
      expect(refusal(submit(radio, info("ccccccccccc", { durationMs: 10 * MINUTE }), bia, 0))).toBe(
        "accepted",
      );
    });

    it("the track on air", () => {
      expect(refusal(submit(radio, info("aaaaaaaaaaa"), bia, 0))).toBe("on-air");
    });

    it("a track already waiting in the queue", () => {
      expect(refusal(submit(radio, info("bbbbbbbbbbb"), bia, 0))).toBe("already-queued");
    });

    it("a fourth waiting track from the same submitter, but not the one on air", () => {
      // Ana's first track is on air, so three more of hers may wait.
      const full = radioWith(["aaaaaaaaaaa", "bbbbbbbbbbb", "ccccccccccc", "ddddddddddd"]);
      expect(waiting(full)).toHaveLength(3);

      expect(refusal(submit(full, info("eeeeeeeeeee"), ana, 0))).toBe("too-many-waiting");
      expect(refusal(submit(full, info("eeeeeeeeeee"), bia, 0))).toBe("accepted");
    });

    it("without changing the radio", () => {
      const submission = submit(radio, info("bbbbbbbbbbb"), bia, 0);
      expect(submission).toEqual({ kind: "refused", reason: "already-queued" });
      expect(waiting(radio)).toEqual(["bbbbbbbbbbb"]);
    });
  });
});

describe("advance", () => {
  it("leaves the track on air until it ends", () => {
    const radio = radioWith(["aaaaaaaaaaa", "bbbbbbbbbbb"]);

    expect(advance(radio, 3 * MINUTE - 1)).toEqual({ radio, events: [] });
  });

  it("puts the next track on air at the moment the previous one ended, however late it runs", () => {
    const radio = radioWith(["aaaaaaaaaaa", "bbbbbbbbbbb"], ana, 1000);
    const { radio: next, events } = advance(radio, 1000 + 3 * MINUTE + 750);

    expect(next.nowPlaying).toMatchObject({
      track: { videoId: "bbbbbbbbbbb" },
      startedAt: 1000 + 3 * MINUTE,
    });
    expect(next.queue).toEqual([]);
    expect(events).toEqual([{ kind: "on-air", nowPlaying: next.nowPlaying }]);
  });

  it("catches up over every track that ended meanwhile, such as while the room was empty", () => {
    const radio = radioWith(["aaaaaaaaaaa", "bbbbbbbbbbb", "ccccccccccc"]);
    const { radio: next, events } = advance(radio, 6 * MINUTE + 10);

    expect(onAir(next)).toBe("ccccccccccc");
    expect(next.nowPlaying?.startedAt).toBe(6 * MINUTE);
    expect(
      events.map((event) => event.kind === "on-air" && event.nowPlaying.track.videoId),
    ).toEqual(["bbbbbbbbbbb", "ccccccccccc"]);
  });

  it("falls silent when the queue runs out", () => {
    const { radio, events } = advance(radioWith(["aaaaaaaaaaa"]), 3 * MINUTE);

    expect(radio).toEqual(silentRadio);
    expect(events).toEqual([]);
  });

  it("is what a submission sees: a track that has ended no longer counts as on air", () => {
    const radio = radioWith(["aaaaaaaaaaa"]);
    const submission = accepted(submit(radio, info("aaaaaaaaaaa"), bia, 3 * MINUTE));

    expect(submission.radio.nowPlaying?.startedAt).toBe(3 * MINUTE);
  });
});

describe("refusalBeforeLookup", () => {
  it("gives the refusals that need only the video ID, so the catalog is not asked", () => {
    const radio = radioWith(["aaaaaaaaaaa", "bbbbbbbbbbb", "ccccccccccc", "ddddddddddd"]);

    expect(refusalBeforeLookup(radio, "aaaaaaaaaaa", bia, 0)).toBe("on-air");
    expect(refusalBeforeLookup(radio, "ccccccccccc", bia, 0)).toBe("already-queued");
    expect(refusalBeforeLookup(radio, "eeeeeeeeeee", ana, 0)).toBe("too-many-waiting");
    expect(refusalBeforeLookup(radio, "eeeeeeeeeee", bia, 0)).toBeUndefined();
  });

  it("judges the radio as it stands at that moment", () => {
    expect(
      refusalBeforeLookup(radioWith(["aaaaaaaaaaa"]), "aaaaaaaaaaa", bia, 3 * MINUTE),
    ).toBeUndefined();
  });
});

describe("endsAt", () => {
  it("is when the track on air ends, or nothing when the radio is silent", () => {
    expect(endsAt(radioWith(["aaaaaaaaaaa"], ana, 1000))).toBe(1000 + 3 * MINUTE);
    expect(endsAt(silentRadio)).toBeUndefined();
  });
});
