# Day cycle and ambient animations

## Problem Statement

The plaza looks the same at every hour: a fixed evening glow sits over the Map whatever the time, and every tree, flag and speaker is a still picture. The room feels frozen. Players who drop in at night or at lunch see the same scene, and nothing in the world moves unless a Player does.

## Solution

The plaza follows each Player's real clock. A fixed table of Day periods sets the Ambient light and the Lamp glow, and the look moves gradually from one Day period to the next. Lamps and lit windows come on one by one at dusk and go out at dawn. Trees, shrubs, flags and bunting move gently, and speakers pulse while a Track is on air. All of it lives in the client: the room, the protocol and the server do not change.

The Day period table (the times are the Time of day, h = hour + minutes / 60):

| Time  | Day period | Lamp glow |
|-------|------------|-----------|
| 00:00 | Night      | 100%      |
| 04:30 | Late night | 100%      |
| 06:00 | Dawn       | 45%       |
| 08:00 | Morning    | 0%        |
| 12:30 | Midday     | 0%        |
| 15:30 | Afternoon  | 0%        |
| 17:48 | Sunset     | 15%       |
| 19:00 | Dusk       | 60%       |
| 20:30 | Night      | 100%      |

Between two neighbouring keyframes every value is interpolated linearly; after 20:30 it moves towards 00:00, which wraps the day.

## User Stories

1. As a Player, I want the plaza to look like the time of day where I am, so that the room feels connected to my day.
2. As a Player, I want the light to change gradually across the day, so that I never see an abrupt jump.
3. As a Player at night, I want lamps and lit windows to stand out against a darker plaza, so that the room feels cozy.
4. As a Player at dusk, I want lights to come on one by one, so that the plaza wakes up into the night.
5. As a Player at dawn, I want lights to go out one by one, so that morning arrives gradually.
6. As a Player, I want lit lamps to breathe faintly, so that the light feels alive.
7. As a Player at any hour, I want Avatars, Cars and the Ball to remain clearly visible, so that the night never gets in the way of playing.
8. As a Player, I want nicknames, speech bubbles and the room interface unaffected by the time of day, so that they are always readable.
9. As a Player, I want trees and shrubs to sway gently, so that the plaza feels outdoors.
10. As a Player, I want flags and bunting to flutter, so that the plaza feels festive.
11. As a Player, I want speakers to pulse while a Track is on air, and stay still when the Radio is silent, so that they show the music is playing.
12. As a Player, I want neighbouring trees not to sway in unison, so that the motion looks natural.
13. As a Player using reduced motion, I want Ambient animations held still and lamps steady, while the light still follows the time of day, so that the room stays calm.
14. As a developer, I want to preview any Time of day in development, so that I can tune and check every Day period without waiting for the clock.
15. As a map author, I want a lamp's glow and a building's lit windows to follow it when I move it in Tiled, so that light never drifts away from its source.

## Implementation Decisions

- **Time of day is per Player** (taken from the device clock), not Room state. It is never sent to the server.
- **Fixed table**: no seasons, date or geolocation. The Day period name is a keyframe label only and is never shown to Players.
- **`daylight` module**: a pure module in `packages/game-engine/src/daylight/` holds the keyframe table and the interpolation. Given a Time of day it returns the Ambient light parameters (saturation, RGB multiplier, overlay colour and strength) and the Lamp glow level (0–1). Only the renderer uses it, so it is not a domain package (no rule the Room enforces).
- **Ambient light** is a `ColorMatrixFilter` on a scene container that holds the floor, the depth-sorted objects, Players, Cars, the Tennis layer and confetti. Labels and speech bubbles stay on the stage, outside it. The colour values per keyframe are calibrated in a prototype; the acceptance criterion is that Avatars, Cars and the Ball stay clearly visible at the darkest hour. The Time of day is computed every frame from the injected clock.
- **Dev override**: outside production builds, `?time=HH:MM` on the room URL fixes the Time of day. The engine takes the Time of day through an option, so the override lives in `apps/web`.
- **Light sources (ADR-0029)**: a tile in the objects tileset declares its light through custom properties: `glow` (`warm` or `stage`) with the bulb's offset, and optionally `windows`, an image the size of the tile holding only its lit window pixels. The map generator exports one light source per placed object (kind, world position, optional window mask frame), and `lights.png` is removed from the generator, the Tiled map and `public/`. The glow sprites (`warm`, `stage`) are first-party images drawn by a script (ADR-0012).
- **Light layer**: glows (add blend) and window masks are drawn in a layer above the scene and inside the camera-moved world, outside the Ambient light.
- **Lamp glow level is the share of light sources switched on.** Each source has a fixed threshold in [0, 1) derived deterministically from its position, spread so that the share switched on matches the level. A source fades in or out over a short time when the level crosses its threshold. The lit sources breathe (about ±8% alpha over a few seconds, phase per source); under reduced motion they hold steady.
- **Lit windows** in this release: `building-cafe`, `building-brick`, `building-radio`, `building-records` and `food-truck`. Because the light layer sits above the scene, each window mask is cut by an inverse mask of the silhouettes of the Players and Cars in front of its object, rebuilt every frame.
- **Ambient animations** are authored frames: extra PNGs generated by a script from the current object images and reviewed by a human, declared as tile animations in `objects.tsj`. The generator packs every frame in the atlas and exports each object's frame list and durations. Starting timings: trees and shrubs 4 frames over ~2.4 s; flags and bunting 3 frames over ~0.5 s; speakers 2 frames over ~0.25 s, not following the track's tempo. Each object's phase is derived from its position. No server-clock sync. Reduced motion holds the first frame.
- **Speakers on air**: the engine gains `setOnAir(onAir: boolean)`; `apps/web` feeds it from the Radio's Now playing. Speakers animate only while on air.
- ADR-0029 records the light sources; ADR-0016's consequence now points to it. GLOSSARY.md defines Time of day, Day period, Ambient light, Lamp glow and Ambient animation.

## Testing Decisions

- `daylight`: the exact values at each keyframe, a midpoint between two keyframes, the wrap from 20:30 to 00:00, minutes as a fraction of the hour, and the Lamp glow level of `parcial` (15%) and `acendendo` (60%).
- Light source thresholds: deterministic for a position, spread over [0, 1), and the share switched on follows the level within one source; a source's fade and breathing at a given time; steady under reduced motion.
- Ambient animation timeline: the frame at a given time for a given phase, the phase derived from position, and the first frame under reduced motion.
- Map generator: tile properties become light sources and animation frames in the generated output; an unknown `glow` kind, a window mask whose size differs from its tile or an animation frame from another tileset fails loudly.
- No pixels are inspected. No e2e test: nothing crosses client ↔ server.

## Out of Scope

- Showing the Day period in the interface.
- Food-truck smoke, the stage and the match screen animated.
- Car headlights.
- Weather, seasons, real sunrise and sunset times.
- The UI theme following the Time of day.
- Syncing Ambient animations or lamp breathing between Players.
