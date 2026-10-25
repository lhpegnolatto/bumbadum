# Dance choreography, sound-note effect and plaza cleanup

## Problem Statement

The room's Dance currently shows only the existing side-step choreography. Players need a richer visual cue that they are dancing together, including a turning phase and a visual sound-note effect. The centre of the plaza is also crowded by 24 audience chairs, making the shared dance area feel visually cluttered.

## Solution

Extend the existing synchronized Dance choreography with two alternating phases: the current `passinho` sequence and a new `giro` sequence built from existing avatar frames. Show a four-frame rainbow sound-note effect above every Player while their Dance is active, synchronized from the same server clock and held to one static frame under reduced motion. Remove only the 24 central plaza chairs from the canonical Tiled map, leaving the floor walkable and all other map objects unchanged.

## User Stories

1. As a Player, I want my Dance to alternate between the familiar passinho and a giro, so that dancing feels more expressive.
2. As a Player, I want the giro to present my Avatar facing the cardinal directions, so that the movement reads as a turn even though it uses the existing pixel frames.
3. As a Player, I want the giro to end facing down, so that the visual choreography does not leave my Player in an unexpected stored Direction.
4. As a Player, I want the passinho and giro phases to have equal duration, so that neither half of the choreography feels rushed.
5. As a Player, I want everyone dancing to show the same Dance frame at the same server time, so that the room feels like a shared dance floor.
6. As a Player, I want walking to take priority over the Dance, so that a moving Player does not appear to dance in place.
7. As a Player, I want the Dance to stop when I move, so that the choreography reflects my current activity.
8. As a Player, I want the Dance to stop when I use the Wardrobe, so that visual customization and dancing do not conflict.
9. As a Player, I want a visual sound-note effect above every dancing Player, so that the connection between dancing and the Radio is clear.
10. As a Player, I want the sound-note effect to be visual only, so that it does not add competing audio to the Radio.
11. As a Player, I want the sound-note effect to use the supplied rainbow note artwork, so that it matches the intended visual style.
12. As a Player, I want the sound-note effect to be synchronized with the Dance clock, so that all dancing Players change effect frames together.
13. As a Player, I want the sound-note effect to disappear immediately when a Dance stops, so that stale effects are not left in the room.
14. As a Player using reduced motion, I want the Dance to hold a static pose and the sound-note effect to hold one static frame, so that the room remains understandable without continuous motion.
15. As a Player, I want the effect to follow the Avatar above its head, so that it is clear which Player is producing it.
16. As a Player, I want the effect to appear for other Players as well as for me, so that the room's shared activity is visible.
17. As a Player, I want the centre of the plaza to be free of the 24 audience chairs, so that there is a clean area for dancing.
18. As a Player, I want the floor under the removed chairs to remain walkable, so that removing decoration does not unexpectedly change movement.
19. As a Player, I want benches and all non-central-chair objects to remain, so that the plaza keeps its surrounding character.
20. As a maintainer, I want the Tiled map to remain the source of truth for the chair removal, so that generated client and world assets cannot drift.
21. As a maintainer, I want the server protocol and Player state shape to remain unchanged, so that this visual improvement does not add network complexity.

## Implementation Decisions

- Keep the existing `Dance` concept and server message unchanged. The server continues to store only the Dance ID or no Dance.
- Extend the existing choreography data so one loop contains the complete `passinho` phase followed by the complete `giro` phase.
- Keep the existing 110 BPM timing and use eight beats for each phase. The giro presents `left`, `up`, `right`, and `down` in order and ends facing down. Its direction is choreography data only and does not mutate the Player's stored Direction.
- Reuse existing idle and walk frames for the giro, preserving compatibility with every current and future Avatar wearable as required by ADR-0021.
- Continue deriving Dance frames from the estimated server clock. Before clock synchronization, the existing local fallback remains in effect.
- Keep walking and bump animation higher priority than Dance. A Player who is moving does not render the Dance or its sound-note effect.
- Load the supplied `fx_notas_4q_arco_iris.png` artwork as a four-frame, 48-by-48 visual effect in the game engine. Do not add audio playback.
- Derive the sound-note frame from the same server-clock phase as the Dance, changing once every two beats. All dancing Players therefore show the same effect frame at a given server time.
- Render the sound-note effect above the Avatar and remove it as soon as the Player is no longer dancing or is moving.
- Under reduced motion, hold the Dance's still pose and one static sound-note frame without floating or frame changes.
- Keep the effect implementation in the client/game-engine boundary. It does not become a protocol field, server state, or domain package dependency on PixiJS/assets.
- Remove the 24 central `chair` tile objects from the canonical plaza Tiled map only. Keep the collision layer unchanged so the released tiles remain walkable.
- Regenerate all map outputs after editing the source map. Generated files are never edited directly.
- Update depth/object tests so they describe the absence of central chairs rather than chair seating. Preserve walkability and reachability assertions.
- Update the avatar and game-engine logic tests through their public interfaces. Add an end-to-end assertion only if the existing e2e observability can expose the new visual state without reading canvas pixels.
- The glossary now defines `passinho`, `giro`, and `sound-note effect`. No new ADR is required: the work preserves the existing choreography and canonical-map decisions.

## Testing Decisions

- Test choreography through the public avatar package interface, asserting the exact phase order, equal phase durations, server-time determinism, final down-facing frame, and reduced-motion pose.
- Test the game-engine animation seam through `AvatarAnimation`, asserting that the sound-note effect follows Dance timing, holds under reduced motion, and is absent while walking.
- Preserve the existing tests proving walking takes priority over Dance.
- Test map behavior through generated map/object outputs and public depth/world behavior: no central chairs remain, the central tiles remain walkable, and all walkable tiles remain reachable.
- Run the map generator after changing the Tiled source and run its check mode through the repository's normal check command.
- Use the existing Dance Playwright flow as the appropriate multiplayer regression coverage for start/stop behavior. Do not inspect canvas pixels; use existing e2e observability where applicable.
- Finish with `pnpm check` and `pnpm test:e2e` because the feature changes both client rendering and shared room-visible behavior.

## Out of Scope

- Adding new avatar body, clothing, or Dance artwork.
- Geometric rotation of PixiJS avatar containers or individual sprite layers.
- Changing the Player's stored Direction during a Dance.
- Adding audio notes, sound effects, or changes to Radio playback.
- Adding a new Dance command, Dance ID, protocol message, or server-side Dance phase state.
- Randomizing sound-note phase or direction per Player.
- Removing benches, picnic tables, peripheral chairs, or any other plaza decoration.
- Changing collision tiles, spawn points, plaza dimensions, or the Tiled map's canonical-source workflow.
- Adding a new decorative dance-floor tile or replacing the released floor area with another asset.

## Further Notes

The provided effect assets are currently unreferenced by the application. Their existing filenames are retained as supplied; the browser-facing asset location and loader entry should follow the repository's existing asset-loading conventions. The current central chair tests intentionally encode the old visual arrangement and must be revised as part of this feature rather than bypassed.
