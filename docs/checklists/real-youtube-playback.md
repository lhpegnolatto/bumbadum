# Real YouTube playback checklist

Automated tests never touch YouTube: unit and room tests use a fake `TrackCatalog` and `MusicSearch`, and Playwright uses the fake catalog and search (`TRACK_CATALOG=fake`, `MUSIC_SEARCH=fake`) and a fake screen player (`NEXT_PUBLIC_E2E=1`). Run this by hand before each deploy that touches the radio, the screen or the clock sync, against the environment you are about to ship (a Vercel preview plus the Render server, or both apps run locally with a real key).

## Setup

- [ ] `apps/server` has `YOUTUBE_API_KEY` set (Render dashboard, or `apps/server/.env` locally) and `TRACK_CATALOG` and `MUSIC_SEARCH` unset. The server log shows no `YOUTUBE_API_KEY is not set` warning at startup.
- [ ] Two machines (or two browsers, one of them Firefox), with sound, both on the same room link.
- [ ] Test videos at hand: a normal song under 10 minutes, a [120 BPM metronome](https://www.youtube.com/watch?v=m-0FoVq-auc) (exactly 10 minutes, easiest to hear drift), a live stream, a video longer than 10 minutes, a playlist link with `&list=`, and a video whose owner disabled embedding.

## Playing

- [ ] Before anything plays, the screen shows "Nothing playing" at the top of the side column, 16:9, at least 400×225 px.
- [ ] `/play <song link>` in browser A: both browsers announce the track queued and now playing, and both screens start playing it within a couple of seconds, with sound and without clicking the player.
- [ ] `/tocar <video ID>` from browser B queues a second track; both queue lists show it with B's nickname.
- [ ] With the metronome on air, the clicks of the two machines sound together (no audible echo) for a full minute.
- [ ] Reload browser B mid-track: it lands at the same position as A (a late joiner), and the clicks line up again within a few seconds.
- [ ] In browser A, drag the screen's own seek bar a few seconds away: within about two seconds it jumps back to the radio's position.
- [ ] Throttle browser B's network (DevTools, "Slow 4G") for a while, then restore it: playback catches up and lines up again.
- [ ] When the first track ends, the next one goes on air on both screens; when the queue runs out, both show "Nothing playing" again.
- [ ] Close both browsers while a track plays, wait past its end, and rejoin: the radio has moved on by the clock (the next track at the right position, or silent).

## Refusals

Each gives a notice in the sender's chat only, and nothing on the other browser:

- [ ] A live stream.
- [ ] A video longer than 10 minutes.
- [ ] A video that cannot be embedded.
- [ ] The track on air, and a track already in the queue.
- [ ] A fourth waiting track from the same player.
- [ ] A playlist link with `&list=` plays only the video it names, not the playlist.

## Search and skip

Each name search spends one of about 100 a day, so keep these few:

- [ ] `/play <a song's name>` queues a sensible, embeddable video for that name, on both browsers.
- [ ] The same name again in other case or spacing answers at once (no new search in the Google Cloud quota page) with "That track is on air right now" or "already in the queue".
- [ ] `/skip` from the player who did not submit the track on air announces "voted to skip (1 of 2)" and the track keeps playing; `/pular` from its submitter then skips it at once, and the next track (or "Nothing playing") shows on both screens.

## Per-player volume

- [ ] Moving A's volume slider or muting it changes only A's sound, never B's.
- [ ] After a reload, A's volume and mute are as A left them.

## Compliance (ADR-0006, ADR-0010)

- [ ] Nothing ever draws over the screen: not the wardrobe panel, not chat bubbles, not menus.
- [ ] The screen stays visible and at least 400×225 px at the smallest desktop window size you support.

## Known to verify

- [ ] Chrome and Firefox both apply the nudge rates 0.95 and 1.05 (ticket 06 left this open). In DevTools, the YouTube iframe's `video.playbackRate` shows 0.95 or 1.05 while a small drift is being corrected, never a quarter step.
