# Day cycle and ambient animations

## Problem Statement

The plaza looks the same at every hour: a fixed evening glow sits over the Map whatever the time, and every tree, flag and lamp is a still picture. The room feels frozen. Players who drop in at night or at lunch see the same scene, and nothing in the world moves unless a Player does.

## Solution

The Lobby moves to the v7 plaza (`assets/mapa_praca_v7/`), whose art bundle already carries authored Ambient animations and a calibrated lighting table. The plaza follows each Player's real clock: the table sets the Ambient light, the Lamp glow and the lit windows, and the look moves gradually from one Day period to the next. Lamps and lit windows come on one by one at dusk and go out at dawn, and each lamp flickers briefly now and then. Trees, shrubs, flags and bunting sway, and speakers pulse while a Track is on air. The day cycle lives in the client: the room, the protocol and the server do not change for it.

The Day period table comes from `assets/mapa_praca_v7/iluminacao/iluminacao.json` (h = hour + minutes / 60):

| Time  | Day period | Lamp glow | Lit windows |
|-------|------------|-----------|-------------|
| 00:00 | Night      | 100%      | 100%        |
| 04:30 | Late night | 100%      | 100%        |
| 06:00 | Dawn       | 45%       | 100%        |
| 08:00 | Morning    | 0%        | 0%          |
| 12:30 | Midday     | 0%        | 0%          |
| 15:30 | Afternoon  | 0%        | 0%          |
| 17:48 | Sunset     | 55%       | 100%        |
| 19:00 | Dusk       | 85%       | 100%        |
| 20:30 | Night      | 100%      | 100%        |

Each keyframe also carries the Ambient light: saturation, an RGB multiplier and an overlay colour with its strength. Between two neighbouring keyframes every value is interpolated linearly; after 20:30 it moves towards 00:00, which wraps the day.

## User Stories

1. As a Player, I want the plaza to look like the time of day where I am, so that the room feels connected to my day.
2. As a Player, I want the light to change gradually across the day, so that I never see an abrupt jump.
3. As a Player at night, I want lamps and lit windows to stand out against a darker plaza, so that the room feels cozy.
4. As a Player at dusk, I want lights to come on one by one, so that the plaza wakes up into the night.
5. As a Player at dawn, I want lights to go out one by one, so that morning arrives gradually.
6. As a Player, I want lit lamps to flicker briefly now and then, so that the light feels alive.
7. As a Player at any hour, I want Avatars, Cars and the Ball to remain clearly visible, so that the night never gets in the way of playing.
8. As a Player, I want nicknames, speech bubbles and the room interface unaffected by the time of day, so that they are always readable.
9. As a Player, I want trees and shrubs to sway gently, so that the plaza feels outdoors.
10. As a Player, I want flags and bunting to flutter, so that the plaza feels festive.
11. As a Player, I want speakers to pulse while a Track is on air, and stay still when the Radio is silent, so that they show the music is playing.
12. As a Player, I want neighbouring trees not to sway in unison, so that the motion looks natural.
13. As a Player using reduced motion, I want Ambient animations held still and lamps steady, while the light still follows the time of day, so that the room stays calm.
14. As a developer, I want to preview any Time of day in development, so that I can check every Day period without waiting for the clock.
15. As a map author, I want a lamp's glow and a building's lit windows to follow it when I move it in Tiled, so that light never drifts away from its source.
16. As a Player, I want the new plaza (streets around it, the new circuit, the parking block and the grandstand) to keep working with walking, Cars and Tennis, so that the update never breaks play.

## Implementation Decisions

### The v7 map

- `assets/mapa_praca_v7/` is committed as the raw bundle, like v2 and v4. `normalize-map-assets.mjs` reads it, translating Portuguese names to English kebab-case, and overwrites `assets/map/plaza-v2/` in place: the Lobby keeps its map, only evolved (ADR-0025). Generated outputs are regenerated, never hand-edited.
- The v7 map is 150×52 tiles; everything from earlier versions moved 96 px down. The records and radio buildings are gone, the parking block now has 17 spaces (the 12 Cars still fit), the circuit is new, and the tennis scoreboard art has its digits off.
- The `spawn` point is added in Tiled on a walkable tile of the plaza, just in front of the stage.
- No code hardcodes map coordinates: the tennis scoreboard's position and atlas frame come from the generated placement of the `scoreboard` object.
- The grandstand is floor and collision only; the generator ignores its `arquibancada` seat layer. The circuit centre line (`trajeto_pista`), finish line and starting grid stay unused reference data: the Autodrome remains Free drive.

### Day cycle

- **Time of day is per Player** (taken from the device clock), not Room state. It is never sent to the server.
- **Fixed table**: no seasons, date or geolocation. The Day period name is a keyframe label only and is never shown to Players.
- **`daylight` module**: a pure module in `packages/game-engine/src/daylight/` holds the table above and the interpolation. Given a Time of day it returns the Ambient light parameters, the Lamp glow level and the lit-windows level (0–1). Only the renderer uses it, so it is not a domain package.
- **Ambient light** is a `ColorMatrixFilter` on a scene container that holds the floor, the depth-sorted objects, Players, Cars, the Tennis layer and confetti. Labels and speech bubbles stay on the stage, outside it. The matrix follows the bundle's recipe: saturation, then each channel multiplied by `multiplicar × (1 − alfa)`, plus the overlay colour × `alfa` as offset. The acceptance criterion is that Avatars, Cars and the Ball stay clearly visible at the darkest hour.
- **Dev override**: outside production builds, `?time=HH:MM` on the room URL fixes the Time of day. The engine takes the Time of day through an option, so the override lives in `apps/web`.

### Light sources (ADR-0029)

- A tile in the objects tileset declares its light through custom properties: `glow` (`warm` for lamps, `stage` for the stage) with the offset to the glow's centre, and optionally `windows`, an image the size of the tile holding only its lit window pixels. The generator exports one light source per placed object, and the `lights` image layer is removed from the Tiled map, the generator and `public/`.
- The `warm` glow is the bundle's `brilho_poste_anim.png` (8 frames, 80×52, centred at the lamp's base − 32 px), shown on the same frame as the lamp's own 8-frame flicker, with the bundle's per-frame intensity. The `stage` glow is cut from the bundle's light layer.
- **Lamp glow level is the share of light sources switched on.** Each source has a fixed threshold in [0, 1) derived deterministically from its position, spread so that the share switched on matches the level. A source fades in or out over a short time when the level crosses its threshold. Windows follow the lit-windows level the same way.
- **Light layer**: glows (add blend) and window masks are drawn in a layer above the scene and inside the camera-moved world, outside the Ambient light.
- **Lit windows**: `building-cafe`, `building-brick` and `food-truck`. Each mask is the difference between the bundle's day and night object layers within the object's rectangle. Because the light layer sits above the scene, each window mask is cut by an inverse mask of the silhouettes of the Players and Cars in front of its object, rebuilt every frame.

### Ambient animations

- Frames are the bundle's authored strips (`animacoes/*_anim.png`), declared as tile animations in `objects.tsj` (the bundle's tileset already carries them): trees, pine and shrubs 4 frames × 180 ms, pink and purple flags and bunting 4 frames × 160 ms, lamps 8 frames × 120 ms. The script-generated frames from the first pass and their script are removed.
- The generator packs every frame in the atlas and exports each object's frame list and durations.
- Each object's starting frame is `(x × 7 + y × 13) mod frames` (x, y in px of the object), the bundle's formula. No server-clock sync. Reduced motion holds the first frame and the lamp's steady glow.
- **Speakers on air**: speakers get a 2-frame pulse (~0.25 s, not following the track's tempo); the bundle has none, so it is drawn for the project. The engine gains `setOnAir(onAir: boolean)`; `apps/web` feeds it from the Radio's Now playing. Speakers animate only while on air.

ADR-0029 records the light sources; ADR-0016's consequence points to it. GLOSSARY.md defines Time of day, Day period, Ambient light, Lamp glow and Ambient animation.

## Testing Decisions

- Map: the existing generator tests (stale output, spawn on a walkable tile, every walkable tile reachable) hold for v7; server Car and Tennis tests pass on the new layout.
- `daylight`: the exact values at each keyframe, a midpoint between two keyframes, the wrap from 20:30 to 00:00, minutes as a fraction of the hour, and night legibility.
- Light source thresholds: deterministic for a position, spread over [0, 1), and the share switched on follows the level within one source; a source's fade and flicker at a given time; steady under reduced motion.
- Ambient animation timeline: the frame at a given time for a given starting frame, the bundle's formula, and the first frame under reduced motion.
- Map generator: tile properties become light sources and animation frames in the generated output; an unknown `glow` kind, a window mask whose size differs from its tile or an animation frame from another tileset fails loudly.
- No pixels are inspected. e2e runs for the map migration, which moves the spawn point and every Car and Tennis position.

## Out of Scope

- Showing the Day period in the interface.
- Sitting on the grandstand.
- Races, laps, AI or ghost Cars along the circuit centre line.
- Food-truck smoke, the stage and the match screen animated; the checkered flag (no authored frames).
- Car headlights.
- Weather, seasons, real sunrise and sunset times.
- The UI theme following the Time of day.
- Syncing Ambient animations or lamp flicker between Players.
