import { advance, type Radio, type RadioEvent, silentRadio } from "./radio.ts";

/** Where a skip vote stands: the track is skipped once `votes` reaches `needed`. */
export interface SkipTally {
  votes: number;
  /** More than half of the players present. */
  needed: number;
}

export type SkipVoteOutcome =
  | { kind: "nothing-on-air" }
  /** The voter had already voted against this track: nothing changes. */
  | { kind: "already-voted"; tally: SkipTally }
  | { kind: "counted"; radio: Radio; events: RadioEvent[]; tally: SkipTally }
  | { kind: "skipped"; radio: Radio; events: RadioEvent[] };

/**
 * Casts `voterId`'s skip vote on the track on air at `now`; `present` are the
 * ids of the players in the room, the voter among them.
 */
export function voteToSkip(
  radio: Radio,
  voterId: string,
  present: readonly string[],
  now: number,
): SkipVoteOutcome {
  const advanced = advance(radio, now);
  const { nowPlaying } = advanced.radio;
  if (!nowPlaying) return { kind: "nothing-on-air" };
  if (advanced.radio.skipVotes.includes(voterId)) {
    return { kind: "already-voted", tally: skipTally(advanced.radio, present) };
  }
  const voted = { ...advanced.radio, skipVotes: [...advanced.radio.skipVotes, voterId] };
  const tally = skipTally(voted, present);
  if (nowPlaying.track.submitter.id === voterId || tally.votes >= tally.needed) {
    const skipped = skip(voted, now);
    return {
      kind: "skipped",
      radio: skipped.radio,
      events: [...advanced.events, ...skipped.events],
    };
  }
  return { kind: "counted", radio: voted, events: advanced.events, tally };
}

/**
 * Recounts the skip vote after a player joined or left: the votes of players
 * no longer `present` leave with them, and the track is skipped at `now` if
 * those who stay are now a majority.
 */
export function recountSkipVotes(
  radio: Radio,
  present: readonly string[],
  now: number,
): { radio: Radio; events: RadioEvent[] } {
  const advanced = advance(radio, now);
  const skipVotes = advanced.radio.skipVotes.filter((id) => present.includes(id));
  const recounted =
    skipVotes.length === advanced.radio.skipVotes.length
      ? advanced.radio
      : { ...advanced.radio, skipVotes };
  const tally = skipTally(recounted, present);
  if (!recounted.nowPlaying || tally.votes < tally.needed) {
    return { radio: recounted, events: advanced.events };
  }
  const skipped = skip(recounted, now);
  return { radio: skipped.radio, events: [...advanced.events, ...skipped.events] };
}

/** The votes of the players present against the track on air, and how many it takes. */
export function skipTally(radio: Radio, present: readonly string[]): SkipTally {
  const votes = radio.skipVotes.filter((id) => present.includes(id)).length;
  return { votes, needed: Math.floor(present.length / 2) + 1 };
}

/** Ends the track on air at `now`; the next one in the queue starts at once. */
function skip(radio: Radio, now: number): { radio: Radio; events: RadioEvent[] } {
  const { nowPlaying, queue } = radio;
  if (!nowPlaying) return { radio, events: [] };
  const events: RadioEvent[] = [{ kind: "skipped", track: nowPlaying.track }];
  const [next, ...rest] = queue;
  if (!next) return { radio: silentRadio, events };
  const onAir = { track: next, startedAt: now };
  events.push({ kind: "on-air", nowPlaying: onAir });
  return { radio: { nowPlaying: onAir, queue: rest, skipVotes: [] }, events };
}
