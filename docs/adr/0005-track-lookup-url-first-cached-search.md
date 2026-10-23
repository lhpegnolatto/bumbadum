---
status: accepted
---

# Track lookup: URLs first, cached search behind a port

`/play` accepts a YouTube URL or ID directly, which costs no search quota. A free-text name goes through the YouTube Data API `search.list`, whose own quota bucket allows only about 100 calls per day per project, so results are cached by normalized query and searches are rate-limited per player. The radio domain depends on a `MusicSearch` port; the YouTube client is an adapter in `apps/server`, so the search source can be replaced without touching the domain.

## Consequences

- When the daily search quota runs out, name lookups fail until it resets at midnight Pacific Time; URL submissions keep working.
- Track metadata and duration come from `videos.list`, which is charged to the general 10,000-unit pool and is cheap.

## Considered options

- Unofficial scraping search libraries: no quota, but fragile and against YouTube's terms.
