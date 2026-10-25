# Confetti throw

## Problem Statement

Players can walk, chat and dance together, but they have no playful way to celebrate a track or greet each other in the room. The supplied confetti artwork (`assets/confete/`) includes a ready-made throw whose confetti always lands exactly two tiles ahead and only facing down, right or up. That fixed version is too rigid: a throw should react to what is in front of the Player.

## Solution

A Player can make a Confetti throw in the Direction they face. The confetti flies in an arc to its Throw target: the first Player ahead, the floor short of the first blocked tile, or the end of the throw's three-tile reach. Everyone in the room sees the same throw land at the same place. The animation is put together from the supplied modular pieces: the hand pose, a spinning projectile on a computed arc and the impact burst. It is never the baked two-tile sheet.

## User Stories

1. As a Player, I want to throw confetti ahead of me, so that I can celebrate with the room.
2. As a Player, I want the confetti to land on the first Player in front of me, so that I can throw confetti at a friend.
3. As a Player, I want the confetti to fall short of a wall or object, so that it never flies through blocked tiles.
4. As a Player facing a wall right in front of me, I want the confetti to burst against it, so that the throw still visibly happens.
5. As a Player, I want the confetti to fly at most three tiles, so that the throw reads as tossed by hand.
6. As a Player, I want a Player standing on my own tile to be ignored, so that the confetti flies ahead rather than bursting on me.
7. As a Player, I want everyone in the room to see my throw land in the same place, so that it is a shared moment.
8. As a Player, I want to throw with the E key, a button beside the Dance button, or the `/confetti` or `/confete` Command, so that it works on a keyboard, on a phone and in the chat.
9. As a Player, I want holding E not to repeat the throw, so that one press is one throw.
10. As a Player, I want to throw while walking, so that throwing never interrupts moving.
11. As a Player, I want a throw to end my Dance, so that the hand pose never clashes with the choreography.
12. As a Player, I want my hand to show the confetti only while throwing, so that my Avatar is not cluttered the rest of the time.
13. As a Player, I want the hand behind my Avatar when throwing up and in front otherwise, so that the pose looks right.
14. As a Player, I want the confetti and its burst drawn above Avatars and map objects but below speech bubbles, so that the throw is visible without hiding chat.
15. As a Player using reduced motion, I want only a brief static burst at the Throw target, so that the room stays calm.
16. As a Player, I want a throw to make no sound and no chat message, so that it never competes with the Radio or the conversation.
17. As a Player hit by confetti, I want nothing to change about me, so that a throw is harmless fun.
18. As a Player, I want throwing to be limited to a short burst and then one a second, so that nobody can flood the room with confetti.
19. As a Player joining later, I want not to see earlier throws, so that only live throws appear.

## Implementation Decisions

- `world` gains the Throw target rule: a pure function of the map, the thrower's tile, their Direction and which tiles are occupied by other Players. The reach is three tiles. The target is a point in tile coordinates (a tile's own coordinates for its middle; half a tile ahead of the thrower when the first tile ahead is blocked) and whether a Player stands there. `world` never learns what a Player is: occupancy comes in as a predicate.
- `protocol` defines two messages under its `world` folder. The client sends a confetti-throw intent with no payload, so the room uses only the position and Direction it holds (ADR-0001). The room broadcasts a confetti-thrown event carrying the thrower's session id, the Direction and the Throw target. Neither one becomes part of the room state.
- The room handles the intent and the `confetti` Command through one path. The path is rate-limited per Player by a token bucket (a burst of 3, then 1 a second, refusals silent). It ends the Dance and broadcasts the event. A throw the rate refuses changes nothing.
- `chat` gains the `confetti` Command (`/confetti`, `/confete`), listed before `help`.
- `game-engine` turns a received throw into an animation. Each client plays it from the start when the event arrives, with no server-clock sync; a throw lasts under a second. A pure timeline picks what to draw at a given elapsed time:
  - the hand pose: hold 120 ms, then prepare 110 ms;
  - the projectile on a parabola, about 105 ms per tile (at least 70 ms), with an arc height in proportion to the distance (about 13 px over two tiles), spinning through its four frames and rotated along its flight;
  - the impact's four frames (70, 90, 110, 140 ms).

  Under reduced motion there is no hand and no flight, only one impact frame held for 600 ms.
- The hand is drawn as part of the thrower's Avatar sprite, so it follows them mid-step. The projectile leaves from where the hand is at the moment of release and flies to the fixed Throw target. The impact sits at chest height over a hit Player and at the tile's middle over the floor.
- The supplied pieces are served from `apps/web/public/sprites/effects/` under kebab-case English names (`confetti-hand.png`, `confetti-projectile.png`, `confetti-impact.png`). `assets/confete/` keeps the files as supplied, including the baked sheet and the preview GIF, which stay unused references.
- `apps/web` sends the intent on E (ignored with modifier keys, in text fields, on key repeat and while the Wardrobe is open) and from a Confetti button beside the Dance button, disabled while the Wardrobe is open. It feeds every confetti-thrown event to the engine.
- No new ADR: a passing event played on receipt is cheap to reverse. GLOSSARY.md defines Confetti throw and Throw target.

## Testing Decisions

- `world`: the Throw target through the package's public interface: open floor reaches three tiles, the first Player ahead is hit, a Player on the thrower's tile is ignored, a blocked tile one or two tiles ahead, and every Direction.
- `protocol`: the intent accepts only an absent payload.
- `chat`: `/confetti` and `/confete` resolve to the Command.
- Server integration tests with `@colyseus/testing`: everyone receives the event with the right target, the Command works without a chat message, a throw ends the Dance, a bad payload is ignored, and the rate limit holds.
- `game-engine`: the throw timeline through its exported functions (phase order and timing, arc endpoints and peak, reduced motion, end of the throw). No pixels are inspected.
- Playwright: one player throws with E, the button and `/confete`, and another sees the throws through `window.bumbadumE2E`.

## Out of Scope

- Aiming with the mouse or by nickname, and throws longer than three tiles.
- Any effect on the Player hit, sound or chat Announcements.
- Server-clock synchronisation of the animation, and replaying throws for late joiners.
- The baked two-tile sheet and the preview GIF.
