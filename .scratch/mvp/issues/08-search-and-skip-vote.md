# Search and skip vote

Status: resolved
Type: task
Blocked by: 07

## What

`/play <name>` through the `MusicSearch` port with the YouTube adapter, cache and rate limit, and `/skip` | `/pular` with skip votes.

See [spec](../spec.md): Radio; ADR-0005.

## Acceptance criteria

- [x] Name searches cached by normalized query; at most 3 per minute per player; an exhausted daily quota yields a notice while URLs keep working.
- [x] The skip vote passes with more than half of the players present, or at once when the submitter votes.
- [x] Votes reset per track; a leaving voter's vote is removed and the majority recomputed on join and leave.
- [x] The YouTube API key lives only in `apps/server` env vars.

## Comments

Built and tested. Notes for later work:

- The search adapter is `apps/server/src/radio/youtube-music-search.ts` (`search.list`, `part=id`, `type=video`, `videoEmbeddable=true`, first result), using the same `YOUTUBE_API_KEY` as the catalog. A found video still goes through the catalog lookup and every refusal rule.
- The cache lives in each room's `RadioStation` (one lobby, so one cache), bounded to 1000 names, least recently used out first. Found and nothing-found answers are cached; failures are not. Identical searches in flight share one API call.
- The limit is an exact sliding window (`apps/server/src/rate-limit/sliding-window.ts`), keyed by session: a player who leaves and rejoins starts a fresh window. Quota is still protected by the cache and the 5-inputs-per-5-seconds chat limit; a global daily cap would be the next step if abuse shows up.
- A bare 11-character word is looked up as a video ID first and searched as a name when the catalog finds no such video.
- E2E uses `MUSIC_SEARCH=fake` (`apps/server/src/radio/fake-music-search.ts`). The `joinLobby` fixture now leaves the room through `window.bumbadumE2E.leave()` before closing each browser, so the 16 seats free at once.
- The real search and skip are on the [manual checklist](../../../docs/checklists/real-youtube-playback.md) ("Search and skip"), run before each deploy with ticket 07's.
