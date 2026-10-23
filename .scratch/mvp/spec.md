# MVP

Friends open one public link, build an avatar, join the lobby, walk around, chat and hear the same track at the same moment. The MVP is done when that whole loop runs in production (Vercel + Render free plan) for a group of up to 16 players.

Terms follow [GLOSSARY.md](../../GLOSSARY.md). Decisions that are hard to reverse live in [docs/adr/](../../docs/adr/); this spec only points to them.

## Platform and language

- Desktop only. On a touch device the home page shows a notice asking to open it on a computer.
- The UI and the commands exist in Brazilian Portuguese and English ([ADR-0009](../../docs/adr/0009-server-speaks-codes-client-translates.md)).
  - First visit: `pt*` browser languages get pt-BR, anything else gets English. A switcher on the home page changes it; the choice is stored in `localStorage`. The URL carries no language.
  - The server sends notices and announcements as a code plus parameters; each client renders them in its own language. Player messages are never translated.
  - Every command name works for every player: `/play` | `/tocar`, `/skip` | `/pular`, `/help` | `/ajuda`.

## Room

- One room, `lobby` ([ADR-0008](../../docs/adr/0008-single-lobby-multi-room-ready.md)), capped at 16 players. The 17th sees "room full".
- Joining requires clicking "Join", which also unlocks browser autoplay.

## World

- One hand-made, hard-coded map of about 20×15 tiles. It fits the viewport; the camera does not move.
- Tiles are drawn with plain shapes and colours. Real tileset art is out of the MVP (see the tileset research ticket).
- A player appears on the spawn point when joining or reconnecting.
- Movement: `WASD` or arrows, one step per tile. Holding a key repeats steps at a fixed rate; pressing towards a blocked tile only turns the player. Players do not collide with each other.
- The client predicts its own steps; the server validates each one and corrects the client when it disagrees. Speed and correction feel come from the movement prototype.

## Layout and keyboard

- The canvas sits on the left. A column on the right holds the screen (16:9, at least 400×225 px), the queue and the chat ([ADR-0010](../../docs/adr/0010-screen-in-side-column.md)).
- Keys: `WASD`/arrows walk; `Enter` focuses the chat (keys stop moving the player while it is focused); `C` opens the wardrobe panel; `Esc` closes the panel or leaves the chat.

## Avatar and nickname

- The home page has the nickname field and the avatar editor. Nickname: 1–16 characters, trimmed, not unique.
- The editor uses exactly the MetroCity assets in `apps/web/public/sprites/` (CC0, see [ASSETS.md](../../ASSETS.md), [ADR-0011](../../docs/adr/0011-only-redistributable-assets.md)): 6 skin tones, 8 hairs (each with its own colour) and 6 outfits. Every layer is mandatory.
- In the room, a HUD button or `C` opens the same editor in a side panel that never covers the screen. The nickname cannot be changed there.
  - Changes preview locally only. "Wear" (or closing the panel with pending changes) sends the new avatar to the room and stores it in `localStorage`.
  - The server accepts at most one avatar change every 2 seconds per player.

## Chat

- Messages go to the whole room. They appear in the chat history and as a bubble over the sender's avatar for a few seconds.
- Up to 200 characters; at most 5 messages per 5 seconds per player.
- A joining player receives the last 50 messages kept in memory.
- Announcements in the history: a player joining or leaving, a track queued, a new track on air.
- A refused or unknown command gets a notice, visible only to the sender.

## Help

- A fixed hint under the chat input lists the commands in the UI language.
- `/help` | `/ajuda` replies with a notice listing the commands in the asker's language.
- Typing `/` opens an autocomplete with the command names in the UI language; names in the other language also appear once the typed prefix matches them.

## Radio

- `/play <url|name>` | `/tocar <url|name>` adds a track to the queue. URLs and IDs skip search; names go through `MusicSearch` ([ADR-0005](../../docs/adr/0005-track-lookup-url-first-cached-search.md)).
- The queue is FIFO. A player may have at most 3 tracks waiting in it.
- A submission is refused, with a notice, when the video is a live stream, cannot be embedded, is longer than 10 minutes, or is already queued or on air. A playlist URL plays only the video it names.
- Name searches: at most 3 per minute per player, cached by normalized query.
- `/skip` | `/pular` casts a skip vote. The track is skipped once more than half of the players present have voted, or at once when its submitter votes. Votes reset with every track; a leaving player's vote leaves with them, and the majority is recomputed on every join and leave.
- When the queue runs out the radio is silent and the screen shows a "nothing playing" state. No autoplay or recommendations.
- The radio keeps advancing by the server clock while the room is empty ([ADR-0004](../../docs/adr/0004-radio-sync-by-server-clock.md)).
- Each player has their own volume and mute, stored in `localStorage`, affecting nobody else.
- Drift threshold and correction style (seek vs. gradual) come from the radio sync prototype.

## Server wake-up and reconnection

Render's free plan sleeps after ~15 minutes idle and takes about a minute to wake ([ADR-0007](../../docs/adr/0007-vercel-web-render-server.md)).

- The home page pings the server's health endpoint as soon as it loads, so the server is often awake by the time the player clicks "Join".
- If it is not, a waiting screen shows: visible stages ("waking the server" → "joining the room"), elapsed time with "usually takes up to a minute", a few rotating light-hearted lines, and joins automatically when ready.
- After 3 minutes it shows an error with a "try again" button.
- A dropped connection reconnects automatically with the same nickname and avatar, through the same screen ("reconnecting…"); the player returns to the spawn point.

## Testing

- Domain packages test-first; server rooms with `@colyseus/testing` and a fake `MusicSearch`.
- Playwright uses a fake screen player behind the same interface and a fake `MusicSearch`, so CI never touches YouTube.
- Real YouTube playback is checked by hand with a checklist before each deploy.

## Out of scope

More rooms, moderation (kick, ban, admin; rate limits are the only protection), proximity chat or audio, emotes, direct messages, playlist import, mobile, saved outfits, a keep-alive pinger for Render, tileset art.

## Delivery

Vertical slices, each one deployed when done, plus two prototypes that gate their slices. Tickets live in [issues/](issues/):

1. [01 Walking skeleton](issues/01-walking-skeleton.md), with i18n from day one.
2. [02 Movement prototype](issues/02-movement-prototype.md) → [03 World](issues/03-world.md).
3. [04 Avatar](issues/04-avatar.md).
4. [05 Chat](issues/05-chat.md).
5. [06 Radio sync prototype](issues/06-radio-sync-prototype.md) → [07 Radio by URL](issues/07-radio-by-url.md).
6. [08 Search and skip vote](issues/08-search-and-skip-vote.md).
7. [09 Help](issues/09-help.md).
8. [10 Server wake-up experience](issues/10-server-wake-up.md), which may move right after the skeleton.

[11 Tileset research](issues/11-tileset-research.md) is outside the MVP.
