/** A player who puts tracks in the queue, known by their session. */
export interface Submitter {
  id: string;
  nickname: string;
}

/** What the track catalog knows about a video. */
export interface TrackInfo {
  videoId: string;
  title: string;
  durationMs: number;
  embeddable: boolean;
  /** Live now, or an upcoming live stream or premiere. */
  live: boolean;
}

export interface Track {
  videoId: string;
  title: string;
  durationMs: number;
  submitter: Submitter;
}

/** The track on air and when it started, in server time (ADR-0004). */
export interface NowPlaying {
  track: Track;
  startedAt: number;
}

export interface Radio {
  nowPlaying?: NowPlaying;
  /** The tracks waiting to go on air, oldest first. */
  queue: readonly Track[];
}

export type Refusal =
  | "live"
  | "not-embeddable"
  | "too-long"
  | "on-air"
  | "already-queued"
  | "too-many-waiting";

export type RadioEvent =
  | { kind: "queued"; track: Track }
  | { kind: "on-air"; nowPlaying: NowPlaying };

export type Submission =
  | { kind: "accepted"; radio: Radio; events: RadioEvent[] }
  | { kind: "refused"; reason: Refusal };

export const silentRadio: Radio = { queue: [] };

/** The longest track the radio accepts. */
export const MAX_TRACK_DURATION_MS = 10 * 60_000;

/** How many tracks one submitter may have waiting in the queue. */
export const MAX_WAITING_PER_SUBMITTER = 3;

/**
 * The refusals that need only the video ID, so the room can give them before
 * asking the catalog. `submit` applies them again, since the radio may have
 * changed while the catalog answered.
 */
export function refusalBeforeLookup(
  radio: Radio,
  videoId: string,
  submitter: Submitter,
  now: number,
): Refusal | undefined {
  const current = advance(radio, now).radio;
  if (current.nowPlaying?.track.videoId === videoId) return "on-air";
  if (current.queue.some((track) => track.videoId === videoId)) return "already-queued";
  const waiting = current.queue.filter((track) => track.submitter.id === submitter.id).length;
  if (waiting >= MAX_WAITING_PER_SUBMITTER) return "too-many-waiting";
  return undefined;
}

/**
 * Adds a track to the radio at `now`: straight on air when nothing is playing,
 * otherwise last in the queue. Tracks that ended by `now` are moved past first.
 */
export function submit(
  radio: Radio,
  info: TrackInfo,
  submitter: Submitter,
  now: number,
): Submission {
  const refusal = refusalOf(info) ?? refusalBeforeLookup(radio, info.videoId, submitter, now);
  if (refusal) return { kind: "refused", reason: refusal };

  const advanced = advance(radio, now);
  const track: Track = {
    videoId: info.videoId,
    title: info.title,
    durationMs: info.durationMs,
    submitter,
  };
  const events: RadioEvent[] = [...advanced.events, { kind: "queued", track }];
  if (advanced.radio.nowPlaying) {
    return {
      kind: "accepted",
      radio: { ...advanced.radio, queue: [...advanced.radio.queue, track] },
      events,
    };
  }
  const nowPlaying = { track, startedAt: now };
  events.push({ kind: "on-air", nowPlaying });
  return { kind: "accepted", radio: { nowPlaying, queue: [] }, events };
}

function refusalOf(info: TrackInfo): Refusal | undefined {
  if (info.live) return "live";
  if (!info.embeddable) return "not-embeddable";
  if (info.durationMs > MAX_TRACK_DURATION_MS) return "too-long";
  return undefined;
}

/**
 * Moves the radio on to `now` by the clock: every track that has ended gives
 * way to the next one, which starts the moment the previous one ended, so the
 * radio keeps time however late this runs (also while the room is empty).
 */
export function advance(radio: Radio, now: number): { radio: Radio; events: RadioEvent[] } {
  const events: RadioEvent[] = [];
  let { nowPlaying, queue } = radio;
  while (nowPlaying && now >= nowPlaying.startedAt + nowPlaying.track.durationMs) {
    const [next, ...rest] = queue;
    const endedAt = nowPlaying.startedAt + nowPlaying.track.durationMs;
    nowPlaying = next && { track: next, startedAt: endedAt };
    queue = rest;
    if (nowPlaying) events.push({ kind: "on-air", nowPlaying });
  }
  if (events.length === 0 && nowPlaying === radio.nowPlaying) return { radio, events };
  return { radio: nowPlaying ? { nowPlaying, queue } : silentRadio, events };
}

/** When the track on air ends, which is when the radio next changes by itself. */
export function endsAt(radio: Radio): number | undefined {
  const { nowPlaying } = radio;
  return nowPlaying && nowPlaying.startedAt + nowPlaying.track.durationMs;
}
