# Movement prototype

Status: ready-for-agent
Type: prototype

## What

A throwaway prototype to settle how step movement feels before ticket 03 builds it: steps per second while a key is held, the delay before repeating, turning towards a blocked tile, and how a server correction looks (snap vs. short slide) under simulated latency of 50–300 ms.

## Acceptance criteria

- [ ] The human tries it and picks the step rate, repeat delay and correction style.
- [ ] The chosen values are recorded under `## Answer`; the prototype code is not merged.
