# Radio sync prototype

Status: ready-for-agent
Type: prototype

## What

A throwaway prototype of ADR-0004 with the real YouTube embed and two or more browser windows: measure the clock offset estimate, then try drift thresholds and correction styles (seek vs. small playback-rate nudges) and judge what is audible.

## Acceptance criteria

- [ ] The human listens on two machines and picks the drift threshold and correction style.
- [ ] The chosen values and the ping scheme are recorded under `## Answer`; the prototype code is not merged.
