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
  type MusicSearch,
  normalizeSearchQuery,
  type Radio,
  type RadioEvent,
  readTrackRequest,
  recountSkipVotes,
  refusalBeforeLookup,
  type SearchResult,
  type SkipTally,
  type Submitter,
  silentRadio,
  skipTally,
  submit,
  type Track,
  type TrackCatalog,
  voteToSkip,
} from "@bumbadum/radio";
import type { Client } from "@colyseus/core";
import { SlidingWindow } from "../rate-limit/sliding-window.ts";
import { TokenBucket } from "../rate-limit/token-bucket.ts";
import { type CachedSearch, SearchCache } from "./search-cache.ts";

/** A burst of clock pings is 8 (ticket 06): two bursts may come at once, then one ping every 2 s. */
const PING_RATE = { capacity: 16, perSecond: 0.5 };

/**
 * Name searches per player: exactly 3 in any minute, since the whole server
 * gets about 100 a day (ADR-0005). A cached name does not count.
 */
const SEARCH_RATE = { limit: 3, windowMs: 60_000 };

/** The part of the room the radio works through. */
export interface RadioRoom {
  readonly state: {
    radio: RadioState;
    /** The players present, by session id: the skip vote counts against them. */
    players: { keys(): Iterable<string> };
  };
  broadcast(type: string, message: unknown): void;
  readonly clock: { setTimeout(run: () => void, ms: number): { clear(): void } };
}

/** Where the radio learns about tracks: by video ID, and by name. */
export interface TrackSources {
  catalog: TrackCatalog;
  search: MusicSearch;
}

/**
 * A room's radio: takes `/play` requests, looks tracks up in the catalog or
 * searches them by name, counts skip votes, advances by the server clock and
 * mirrors the radio into the room state. Time is the server's wall clock,
 * which clients sync to with pings (ADR-0004).
 */
export class RadioStation {
  readonly #room: RadioRoom;
  readonly #catalog: TrackCatalog;
  readonly #search: MusicSearch;
  readonly #searchCache = new SearchCache();
  /** Searches on their way to the API, by normalized query. */
  readonly #searching = new Map<string, Promise<SearchResult>>();
  readonly #now: () => number;
  readonly #pingLimits = new Map<string, TokenBucket>();
  readonly #searchLimits = new Map<string, SlidingWindow>();
  /** Session ids whose connection dropped and may still come back. */
  readonly #dropped = new Set<string>();
  #radio: Radio = silentRadio;
  #timer: { clear(): void } | undefined;

  constructor(room: RadioRoom, { catalog, search }: TrackSources, now: () => number = Date.now) {
    this.#room = room;
    this.#catalog = catalog;
    this.#search = search;
    this.#now = now;
  }

  /** Call once the player is present: they raise the votes a skip needs. */
  welcome(client: Client) {
    this.#pingLimits.set(client.sessionId, new TokenBucket(PING_RATE, this.#now()));
    this.#searchLimits.set(client.sessionId, new SlidingWindow(SEARCH_RATE));
    this.#recountSkipVotes();
  }

  /** Call once the player is gone: their skip vote leaves with them. */
  farewell(client: Client) {
    this.#pingLimits.delete(client.sessionId);
    this.#searchLimits.delete(client.sessionId);
    this.#dropped.delete(client.sessionId);
    this.#recountSkipVotes();
  }

  /** Call when the player's connection drops: while it is down they are not present. */
  drop(client: Client) {
    this.#dropped.add(client.sessionId);
    this.#recountSkipVotes();
  }

  /** Call when a dropped player reconnects: they are present again. */
  reconnect(client: Client) {
    this.#dropped.delete(client.sessionId);
    this.#recountSkipVotes();
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
        return this.#playByName(client, submitter, request.name);
      case "video":
        return this.#playVideo(client, submitter, request.videoId);
      case "video-or-name":
        return this.#playVideo(client, submitter, request.videoId, request.name);
    }
  }

  /** Handles `/skip` from the player `voter`; nothing to skip is a notice to them alone. */
  skip(client: Client, voter: Submitter) {
    const outcome = voteToSkip(this.#radio, voter.id, this.#present(), this.#now());
    switch (outcome.kind) {
      case "nothing-on-air":
        return notify(client, { code: "skip-nothing-on-air" });
      case "already-voted":
        return notify(client, { code: "skip-already-voted", params: outcome.tally });
      case "counted":
        this.#apply(outcome.radio, outcome.events);
        return this.#room.broadcast(ANNOUNCEMENT, {
          code: "skip-vote-cast",
          params: { nickname: voter.nickname, ...outcome.tally },
        } satisfies Announcement);
      case "skipped":
        return this.#apply(outcome.radio, outcome.events);
    }
  }

  /** `orName`: what to search for instead if the catalog knows no such video. */
  async #playVideo(
    client: Client,
    submitter: Submitter,
    videoId: string,
    orName?: string,
  ): Promise<void> {
    // Saves a catalog call (and quota) when the answer cannot change it.
    const early = refusalBeforeLookup(this.#radio, videoId, submitter, this.#now());
    if (early) return notify(client, { code: `track-${early}` });

    const lookup = await this.#catalog.lookUp(videoId);
    if (lookup.kind === "not-found") {
      if (orName !== undefined) return this.#playByName(client, submitter, orName);
      return notify(client, { code: "track-not-found" });
    }
    if (lookup.kind === "unavailable") return notify(client, { code: "track-lookup-unavailable" });

    const submission = submit(this.#radio, lookup.info, submitter, this.#now());
    if (submission.kind === "refused")
      return notify(client, { code: `track-${submission.reason}` });
    this.#apply(submission.radio, submission.events);
  }

  async #playByName(client: Client, submitter: Submitter, name: string): Promise<void> {
    const query = normalizeSearchQuery(name);
    let answer: CachedSearch | undefined = this.#searchCache.get(query);
    if (!answer) {
      const result = await this.#searchOnce(client, query);
      if (!result) return notify(client, { code: "search-rate-limited" });
      if (result.kind === "quota-exhausted") {
        return notify(client, { code: "search-quota-exhausted" });
      }
      if (result.kind === "unavailable") return notify(client, { code: "search-failed" });
      answer = result;
      this.#searchCache.set(query, answer);
    }
    if (answer.kind === "nothing-found") return notify(client, { code: "search-nothing-found" });
    return this.#playVideo(client, submitter, answer.videoId);
  }

  /**
   * Searches `query`, joining the same search already on its way, so only
   * one reaches the API; only that one counts against the player's limit.
   * `undefined` means the player is over the limit.
   */
  #searchOnce(client: Client, query: string): Promise<SearchResult> | undefined {
    const pending = this.#searching.get(query);
    if (pending) return pending;
    if (!this.#searchLimits.get(client.sessionId)?.take(this.#now())) return undefined;
    // A search never rejects (see `MusicSearch`).
    const search = this.#search.search(query).finally(() => this.#searching.delete(query));
    this.#searching.set(query, search);
    return search;
  }

  /** Players with a seat and a live connection; a dropped seat waiting for its player does not count. */
  #present(): string[] {
    return [...this.#room.state.players.keys()].filter((id) => !this.#dropped.has(id));
  }

  #recountSkipVotes() {
    const { radio, events } = recountSkipVotes(this.#radio, this.#present(), this.#now());
    this.#apply(radio, events);
  }

  #advance() {
    const { radio, events } = advance(this.#radio, this.#now());
    this.#apply(radio, events);
  }

  #apply(radio: Radio, events: readonly RadioEvent[]) {
    this.#radio = radio;
    mirror(this.#room.state.radio, radio, skipTally(radio, this.#present()));
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
    const track = event.kind === "on-air" ? event.nowPlaying.track : event.track;
    const params = { title: track.title, nickname: track.submitter.nickname };
    const codes = {
      queued: "track-queued",
      "on-air": "now-playing",
      skipped: "track-skipped",
    } as const satisfies Record<RadioEvent["kind"], Announcement["code"]>;
    this.#room.broadcast(ANNOUNCEMENT, { code: codes[event.kind], params } satisfies Announcement);
  }
}

function notify(client: Client, notice: Notice) {
  client.send(NOTICE, notice);
}

/** Writes the radio into the room state, touching only what changed. */
function mirror(state: RadioState, radio: Radio, tally: SkipTally) {
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

  // Colyseus sends only fields whose value changed.
  state.skipVotes = tally.votes;
  state.skipVotesNeeded = tally.needed;
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
