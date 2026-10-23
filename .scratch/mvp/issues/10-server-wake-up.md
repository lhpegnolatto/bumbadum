# Server wake-up experience

Status: ready-for-agent
Type: task
Blocked by: 01

## What

Make Render's cold start pleasant: wake the server early and show a waiting screen that keeps players informed, also used on reconnect.

See [spec](../spec.md): Server wake-up and reconnection.

## Acceptance criteria

- [ ] The home page pings the server's health endpoint on load.
- [ ] Waiting screen: visible stages, elapsed time, "usually takes up to a minute", rotating lines, automatic join when ready.
- [ ] After 3 minutes, an error with "try again".
- [ ] A dropped connection reconnects automatically through the same screen ("reconnecting…") with the same nickname and avatar, back at the spawn point.
