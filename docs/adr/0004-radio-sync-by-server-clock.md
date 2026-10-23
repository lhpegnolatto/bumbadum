---
status: accepted
---

# Radio sync by server clock, with no client host

The server stores what is on air as `{ track, startedAt }` in server time. Each client estimates its offset to the server clock (NTP-style ping) and seeks its own player to `serverNow - startedAt`, correcting itself whenever drift exceeds a small threshold. No client acts as a host, so the radio keeps going regardless of who is connected, and a late joiner lands at the right position.

## Considered options

- A host client broadcasting its playback position: simpler at first, but the radio stalls or jumps whenever the host leaves or lags.
