# Radio by URL

Status: resolved
Type: task
Blocked by: 05, 06

## What

`/play` | `/tocar` with a YouTube URL or ID, the FIFO queue, now playing, the screen in the side column, clock sync with the prototype's values, and per-player volume and mute.

See [spec](../spec.md): Radio, Layout and keyboard.

## Acceptance criteria

- [x] `packages/radio` covers queue, now playing, advancing by clock, the 3-tracks-per-player cap and the refusal rules, test-first.
- [x] Refused with a notice: live streams, non-embeddable videos, tracks over 10 minutes, a track already queued or on air. A playlist URL plays only its video.
- [x] The screen is 16:9, at least 400×225 px, always visible; it shows "nothing playing" when the queue is empty.
- [x] A late joiner lands at the right position; the radio keeps advancing with the room empty.
- [x] Announcements for a track queued and a new track on air.
- [x] Volume and mute are local and stored in `localStorage`.
- [x] E2E with the fake screen player: `/play` in one browser, both show the same track and position.
- [x] Manual checklist for real YouTube playback written and run before deploy. Written: [docs/checklists/real-youtube-playback.md](../../../docs/checklists/real-youtube-playback.md); run by the human with a real API key.

## Comments

Built and tested; what is left needs a human:

1. Create a YouTube Data API v3 key (Google Cloud console, API restricted to "YouTube Data API v3") and set it as `YOUTUBE_API_KEY` on the Render service (`render.yaml` declares it with `sync: false`). Without it, `/play` answers "can't look up tracks right now" and the server logs a warning.
2. Run the [manual checklist](../../../docs/checklists/real-youtube-playback.md) against real YouTube before deploying, then tick the last box and resolve this ticket.

Notes for later tickets: `/play` with a name answers `play-search-unavailable` until ticket 08 adds `MusicSearch`; an 11-character single word is read as a video ID (so it gets "couldn't find that video" if it is not one), which ticket 08 may want to fall back to a search.
