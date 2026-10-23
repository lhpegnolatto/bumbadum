# Radio sync prototype

Status: resolved
Type: prototype

## What

A throwaway prototype of ADR-0004 with the real YouTube embed and two or more browser windows: measure the clock offset estimate, then try drift thresholds and correction styles (seek vs. small playback-rate nudges) and judge what is audible.

## Acceptance criteria

- [x] The human listens on two machines and picks the drift threshold and correction style.
- [x] The chosen values and the ping scheme are recorded under `## Answer`; the prototype code is not merged.

## Answer

Prototype on branch `prototype/radio-sync`, under `prototypes/radio-sync/` (not merged). Tested by ear on two machines with a 120 BPM metronome; the defaults below were confirmed by the human.

- **Clock offset**: bursts of 8 pings 100 ms apart, re-sync every 30 s, take the offset of the lowest-RTT sample.
- **Drift**: expected position `serverNow - startedAt` against the player's `getCurrentTime()`, smoothed as the median over 500 ms, checked every 250 ms.
- **Correction (hybrid)**: above 150 ms of drift, nudge the playback rate to 1 ± 0.05 until drift falls under 40 ms or flips sign; above 1000 ms, hard seek instead, then no corrections for 1500 ms.
- **Seek lead**: seeks land about 90 ms behind; start at 0 and add a lead only if real browsers confirm it.
- **To verify in real Chrome and Firefox**: rates 0.95 and 1.05 are applied although `getAvailablePlaybackRates()` lists only quarter steps.
