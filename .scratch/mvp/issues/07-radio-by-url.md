# Radio by URL

Status: ready-for-agent
Type: task
Blocked by: 05, 06

## What

`/play` | `/tocar` with a YouTube URL or ID, the FIFO queue, now playing, the screen in the side column, clock sync with the prototype's values, and per-player volume and mute.

See [spec](../spec.md): Radio, Layout and keyboard.

## Acceptance criteria

- [ ] `packages/radio` covers queue, now playing, advancing by clock, the 3-tracks-per-player cap and the refusal rules, test-first.
- [ ] Refused with a notice: live streams, non-embeddable videos, tracks over 10 minutes, a track already queued or on air. A playlist URL plays only its video.
- [ ] The screen is 16:9, at least 400×225 px, always visible; it shows "nothing playing" when the queue is empty.
- [ ] A late joiner lands at the right position; the radio keeps advancing with the room empty.
- [ ] Announcements for a track queued and a new track on air.
- [ ] Volume and mute are local and stored in `localStorage`.
- [ ] E2E with the fake screen player: `/play` in one browser, both show the same track and position.
- [ ] Manual checklist for real YouTube playback written and run before deploy.
