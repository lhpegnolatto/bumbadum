import {
  ANNOUNCEMENT,
  type Announcement,
  CLOCK_PONG,
  type ClockPong,
  NOTICE,
  type Notice,
  NowPlayingState,
  type RadioState,
  TrackState,
} from "@bumbadum/protocol";
import {
  advance,
  endsAt,
  type Radio,
  type RadioEvent,
  readTrackRequest,
  refusalBeforeLookup,
  type Submitter,
  silentRadio,
  submit,
  type Track,
  type TrackCatalog,
} from "@bumbadum/radio";
import type { Client } from "@colyseus/core";
import { TokenBucket } from "../rate-limit/token-bucket.ts";

/** A burst of clock pings is 8 (ticket 06): two bursts may come at once, then one ping every 2 s. */
const PING_RATE = { capacity: 16, perSecond: 0.5 };

/** The part of the room the radio works through. */
export interface RadioRoom {
  readonly state: { radio: RadioState };
  broadcast(type: string, message: unknown): void;
  readonly clock: { setTimeout(run: () => void, ms: number): { clear(): void } };
}

/**
 * A room's radio: takes `/play` requests, looks tracks up in the catalog,
 * advances by the server clock and mirrors the radio into the room state.
 * Time is the server's wall clock, which clients sync to with pings (ADR-0004).
 */
export class RadioStation {
  readonly #room: RadioRoom;
  readonly #catalog: TrackCatalog;
  readonly #now: () => number;
  readonly #pingLimits = new Map<string, TokenBucket>();
  #radio: Radio = silentRadio;
  #timer: { clear(): void } | undefined;

  constructor(room: RadioRoom, catalog: TrackCatalog, now: () => number = Date.now) {
    this.#room = room;
    this.#catalog = catalog;
    this.#now = now;
  }

  welcome(client: Client) {
    this.#pingLimits.set(client.sessionId, new TokenBucket(PING_RATE, this.#now()));
  }

  farewell(client: Client) {
    this.#pingLimits.delete(client.sessionId);
  }

  /** Answers a clock ping, already schema-validated. */
  answerPing(client: Client, sentAt: number) {
    const now = this.#now();
    if (!this.#pingLimits.get(client.sessionId)?.take(now)) return;
    client.send(CLOCK_PONG, { sentAt, serverTime: now } satisfies ClockPong);
  }

  /** Handles `/play <args>` from `submitter`; every refusal is a notice to them alone. */
  async play(client: Client, submitter: Submitter, args: string) {
    const request = readTrackRequest(args);
    switch (request.kind) {
      case "missing":
        return notify(client, { code: "play-missing-track" });
      case "not-a-video":
        return notify(client, { code: "play-not-a-video" });
      case "name":
        return notify(client, { code: "play-search-unavailable" });
      case "video":
        break;
    }

    // Saves a catalog call (and quota) when the answer cannot change it.
    const early = refusalBeforeLookup(this.#radio, request.videoId, submitter, this.#now());
    if (early) return notify(client, { code: `track-${early}` });

    const lookup = await this.#catalog.lookUp(request.videoId);
    if (lookup.kind === "not-found") return notify(client, { code: "track-not-found" });
    if (lookup.kind === "unavailable") return notify(client, { code: "track-lookup-unavailable" });

    const submission = submit(this.#radio, lookup.info, submitter, this.#now());
    if (submission.kind === "refused")
      return notify(client, { code: `track-${submission.reason}` });
    this.#apply(submission.radio, submission.events);
  }

  #advance() {
    const { radio, events } = advance(this.#radio, this.#now());
    this.#apply(radio, events);
  }

  #apply(radio: Radio, events: readonly RadioEvent[]) {
    this.#radio = radio;
    mirror(this.#room.state.radio, radio);
    for (const event of events) this.#announce(event);

    this.#timer?.clear();
    this.#timer = undefined;
    const end = endsAt(radio);
    if (end !== undefined) {
      this.#timer = this.#room.clock.setTimeout(
        () => this.#advance(),
        Math.max(0, end - this.#now()),
      );
    }
  }

  #announce(event: RadioEvent) {
    const track = event.kind === "queued" ? event.track : event.nowPlaying.track;
    const params = { title: track.title, nickname: track.submitter.nickname };
    const announcement: Announcement =
      event.kind === "queued" ? { code: "track-queued", params } : { code: "now-playing", params };
    this.#room.broadcast(ANNOUNCEMENT, announcement);
  }
}

function notify(client: Client, notice: Notice) {
  client.send(NOTICE, notice);
}

/** Writes the radio into the room state, touching only what changed. */
function mirror(state: RadioState, radio: Radio) {
  const { nowPlaying } = radio;
  if (!nowPlaying) {
    state.nowPlaying = undefined;
  } else if (
    state.nowPlaying?.startedAt !== nowPlaying.startedAt ||
    state.nowPlaying.track.videoId !== nowPlaying.track.videoId
  ) {
    const next = new NowPlayingState();
    next.track = trackState(nowPlaying.track);
    next.startedAt = nowPlaying.startedAt;
    state.nowPlaying = next;
  }

  const sameQueue =
    state.queue.length === radio.queue.length &&
    radio.queue.every((track, index) => state.queue[index]?.videoId === track.videoId);
  if (!sameQueue) {
    state.queue.clear();
    for (const track of radio.queue) state.queue.push(trackState(track));
  }
}

function trackState(track: Track): TrackState {
  const state = new TrackState();
  state.videoId = track.videoId;
  state.title = track.title;
  state.durationMs = track.durationMs;
  state.submitterId = track.submitter.id;
  state.submitterNickname = track.submitter.nickname;
  return state;
}
