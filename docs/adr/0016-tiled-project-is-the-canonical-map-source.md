---
status: accepted
---

# The Tiled project is the canonical map source

Each Map is authored as a Tiled project under `assets/map/`. A deterministic generator reads it and produces both the server's walkability grid and spawn point in `@bumbadum/world` and the client's floor image, object atlas, object placements and light overlay, so collision and art cannot drift apart. Editing a Map means editing it in Tiled and regenerating, never editing generated output; this mirrors ADR-0013's avatar pipeline.

## Consequences

- The generator reads Tiled layers verbatim: walkability comes only from the collision tile layer and the spawn point from a point object named `spawn`. Game rules such as walkable chairs are edited there, not special-cased in code.
- The light overlay is a pre-rendered image, so moving a lamp in Tiled does not move its glow.
