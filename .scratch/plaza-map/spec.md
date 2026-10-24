# Plaza map for the Lobby

Status: ready-for-agent

## Problem Statement

The Lobby's Map is a temporary 20×15 grid drawn as flat coloured rectangles. Players have no sense of place, nothing in the world relates to music, and no object can stand in front of an avatar. A first-party "music plaza" map now exists as a Tiled project in `refs/mapa_praca/`: 60×40 tiles of 16 px with a stage, audience chairs, stalls, trees, streets and shops, split into floor, object and light layers plus a per-tile collision layer. It has to become the Lobby's Map without breaking server-authoritative movement, crisp pixel art or the overlay layout.

## Solution

Make the plaza the Lobby's Map. Its Tiled project becomes the canonical source under `assets/map/plaza/` (ADR-0016). A deterministic generator produces the server's walkability grid and spawn point for `@bumbadum/world`, and the client's floor image, object atlas, object placements and light overlay. The game engine draws the floor, then objects and players together in depth order, then the lights. A camera follows the local player at the smallest whole-number scale of at least 2× that covers the viewport (ADR-0015).

## User Stories

1. As a Player, I want the Lobby to look like a music plaza with a stage, so that the room feels like a place to listen together.
2. As a Player, I want my avatar large enough to read on a laptop or 1080p screen, so that I can recognise myself and my friends.
3. As a Player, I want the view to follow me as I walk, so that I can explore the whole plaza.
4. As a Player, I want the view to stop at the plaza's edges, so that I never see empty space beyond the Map.
5. As a Player, I want to walk behind trees, lamp posts and buildings, so that the world has depth.
6. As a Player, I want to sit on the audience chairs, so that I can watch the stage with friends.
7. As a Player, I want buildings, stalls, the stage and object bases to block me, so that the world feels solid.
8. As a Player, I want to appear in the open plaza below the audience when I join, so that I start near everyone else.
9. As a Player, I want every walkable tile reachable from where I appear, so that no part of the plaza is unreachable.
10. As a Player, I want the evening light glow over lamps and the stage, so that the plaza feels cozy.

## Implementation Decisions

- **Source.** Move `refs/mapa_praca/` to `assets/map/plaza/` as a Tiled project with English kebab-case file and object names (`arvore_a` → `tree-a`, `camada_1_chao` → `floor`, and so on). Drop the files that are only previews or redundant: `mapa_praca_*.png`, `demo_com_personagens.png`, `colisao_preview.png`, `colisao_retangulos.json`, `colisao_tiles.csv`, `objetos_spritesheet.*`, `camada_1_chao.png`, `camada_2_objetos.png` and the `colisao_objetos` layer. Remove `refs/`.
- **Authoring in Tiled.** Make the 24 audience chairs walkable in the collision tile layer (12 tiles were blocked under them), and block the single enclosed pocket at (43, 14) so every walkable tile is reachable. Each chair's base sits 2 px below the bottom edge of the tile it mostly covers (bases 210, 242, 274 and 306), so a player on that tile is drawn behind the backrest and reads as seated facing the stage. Add a point object named `spawn` in the open plaza below the audience, around tile (30, 22). The stage, buildings, stalls and object bases stay blocked as authored.
- **Generator.** `packages/tooling/generate-map-assets.mjs`, modelled on `generate-avatar-assets.mjs` and using `sharp`, with a `--check` mode wired into the tests so stale output fails `pnpm check`. It reads Tiled layers verbatim and never special-cases objects. It fails when the spawn point is missing, outside the Map or blocked, or when any walkable tile is unreachable from it.
- **Generated output, committed:**
  - `packages/world/src/plaza-map.generated.ts`: width, height, walkability and spawn point. `lobbyMap` is built from it. `createMap`'s ASCII rows remain available to tests.
  - `apps/web/public/sprites/plaza/`: the floor image composed from the floor tile layer and tileset, an object atlas packed from the individual object images, and the light overlay copied as-is.
  - A generated module in `@bumbadum/game-engine` listing each object's atlas frame, position and depth key.
- **Depth.** An object's depth key is the bottom edge of its sprite, which is the Tiled object's `y`. Measured against the authored collision boxes, it is within 3 px of the object's base for every object. Players and objects share one depth-sorted container. On a tie, the player is in front.
- **Layers.** Floor, then objects and players together, then lights with an additive-style blend. Nicknames and speech bubbles stay outside the scaled world, as now.
- **Camera (ADR-0015).** Scale is the smallest whole number of at least 2 at which the Map covers the viewport: 1024×640 → 2, 1920×1080 → 2, 2560×1440 → 3, 3840×2160 → 4. The camera centres on the local player's drawn (gliding) position, clamped to the Map's edges and rounded to whole screen pixels. There is no dead-zone and no offset for the Screen overlay. It replaces `fitMapToViewport`.
- The old 20×15 map, `drawMap` and its colours are removed.
- **Docs.** ADR-0015, ADR-0016, ADR-0014's status and the new definition of Map in `GLOSSARY.md` are already written and ship with this feature.

## Testing Decisions

- `@bumbadum/world`: `lobbyMap` is 60×40, its spawn point is walkable, and every walkable tile is reachable from it. Drop the "edges are walls" test, because streets reach the edge and the bound is the end of the Map. Spot-check a few authored facts: a chair tile is walkable, a stage tile is blocked and a building tile is blocked.
- Generator: its `--check` runs in a package test, like the avatar generator, so editing the Tiled project without regenerating fails `pnpm check`.
- `@bumbadum/game-engine`: a pure camera seam tested for the scale rule on 1024×640, 1920×1080, 2560×1440 and 3840×2160, for centring on the player, for clamping at every edge and corner, and for whole-pixel offsets. Depth ordering is tested as a pure comparison (object vs player, including ties), not through rendered pixels.
- Playwright: the existing walking, presence, chat and speech-bubble specs stay green. No screenshot tests.

## Out of Scope

- Pixel-precise collision, diagonal movement or changes to the Step rules.
- Players standing on the stage, or linking the stage to the Screen.
- Animated objects, a day/night cycle, or lights that follow lamps moved in Tiled.
- More than one Map or room.
- Mobile and touch layout.
- Spreading players out at the spawn point.

## Further Notes

- Decisions were reached in a grilling session on 2026-10-24. The art was generated with Claude for this project and counts as first-party under ADR-0012.
