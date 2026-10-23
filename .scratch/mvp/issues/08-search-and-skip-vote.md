# Search and skip vote

Status: ready-for-agent
Type: task
Blocked by: 07

## What

`/play <name>` through the `MusicSearch` port with the YouTube adapter, cache and rate limit, and `/skip` | `/pular` with skip votes.

See [spec](../spec.md): Radio; ADR-0005.

## Acceptance criteria

- [ ] Name searches cached by normalized query; at most 3 per minute per player; an exhausted daily quota yields a notice while URLs keep working.
- [ ] The skip vote passes with more than half of the players present, or at once when the submitter votes.
- [ ] Votes reset per track; a leaving voter's vote is removed and the majority recomputed on join and leave.
- [ ] The YouTube API key lives only in `apps/server` env vars.
