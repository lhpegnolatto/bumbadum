# Server wake-up experience

Status: resolved
Type: task
Blocked by: 01

## What

Make Render's cold start pleasant: wake the server early and show a waiting screen that keeps players informed, also used on reconnect.

See [spec](../spec.md): Server wake-up and reconnection.

## Acceptance criteria

- [x] The home page pings the server's health endpoint on load.
- [x] Waiting screen: visible stages, elapsed time, "usually takes up to a minute", rotating lines, automatic join when ready.
- [x] After 3 minutes, an error with "try again".
- [x] A dropped connection reconnects automatically through the same screen ("reconnecting…") with the same nickname and avatar, back at the spawn point.

## Comments

Built. The wake-up and reconnect logic is `connectToRoom` in `apps/web/src/features/room/connection.ts`: a pure unit with an injected clock, health check and join, unit-tested on its own. `use-room.ts` wires it to Colyseus and `fetch`, and `waiting-screen.tsx` is the view.

- Timings: a health check every 2 s (each one gives up after 10 s), another 2 s after a failed join, a time-out 3 minutes after the wait starts (for a reconnect, after the drop), and a new light-hearted line every 5 s.
- After a drop, the SDK tries to get the seat back first (about 55 s against a dead server). If the room is lost, the screen goes back to "waking the server" and joins afresh with the same join options, still counting from the drop. The server puts a reconnecting player back on the spawn point (`onReconnect`).
- The avatar does not exist yet (ticket 04). The rejoin reuses the join options, so the avatar comes along once it is one of them.
- E2E covers a server that does not answer its health check at first (the waking stage shows, then the join happens on its own) and the 3-minute time-out with "try again" (Playwright's clock). The drop and reconnect path is covered by unit tests, a `@colyseus/testing` test for the spawn point, and a manual run that killed and restarted the server.
