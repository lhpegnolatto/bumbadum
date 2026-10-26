---
status: accepted
---

# Tiled owns the driving layout

The v2 plaza project in Tiled is the single source of truth for the Lobby's floor, collision, marked circuit area, parking spaces and starting grid. Generators derive runtime map data and client assets from that project; `autodromo.json` is migration/reference material only and is not a second runtime configuration. This prevents parking, collision and circuit metadata from drifting between the server and renderer. The marked circuit is not a hard boundary: Cars may drive across any walkable area.

## Consequences

- The v2 project must provide exactly one canonical `spawn` and use the project's established map-layer vocabulary or an explicitly supported mapping.
- Parking spaces and starting-grid points become generated domain data, including their direction and initial occupancy metadata.
- The generator must account for tile collision, object collision and the marked circuit area.
- The old Lobby slug remains in use; the v2 layout is an extension of the existing shared Map rather than a new selectable Room.
