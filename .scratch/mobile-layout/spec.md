# Room on small and touch viewports

Status: ready-for-agent

## Problem Statement

The room requires a viewport of at least 1024×640 (ADR-0014) and the home page tells touch devices that bumbadum is made for computers. Friends who open a shared link on a phone or a small tablet cannot join, walk, chat or see the Screen. Pixel art is also not reliably crisp: the camera picks a whole-number scale in CSS pixels, but the canvas renders at the device pixel ratio, so on fractional ratios (phones at 2.625 or 2.75, Windows at 125 % or 150 %) one art pixel spans an uneven number of physical pixels.

## Solution

Add a **compact layout** for viewports narrower than 1024 px or shorter than 640 px, in portrait: the world fills the whole viewport, the Screen sits on top with a thin Radio strip beneath it, and floating controls overlay the world: an analogue stick at the bottom centre, Wardrobe and Settings buttons at the bottom left, and a Chat button at the bottom right that opens a sheet with Chat, Queue and Players tabs. Touch movement is offered wherever the primary pointer is coarse, in either layout. The camera scales the world by a whole number of **physical** pixels per art pixel everywhere, and frames the local player in the part of the world the Screen does not cover. The home page works on phones.

Reference wireframes: `ref/mobile-chat-fechado.png` (Chat closed) and `ref/mobile-chat-aberto.png` (Chat open). They define placement and behaviour, not sizes or styling. Green is the world, red the Screen, light blue the movement control, dark blue the Message input, yellow the Chat history or its button, pink the Wardrobe and Settings buttons.

## User Stories

1. As a Player on a phone, I want to join a room from a shared link, so that I can listen with my friends away from a computer.
2. As a Player on a phone, I want the world to fill my screen, so that the room still feels like the main experience.
3. As a Player, I want pixel art to stay sharp on every device, so that sprites never look blurred or unevenly sized.
4. As a Player on a phone, I want the Screen always visible at the top, so that I see the Track on air.
5. As a Player on a phone, I want my avatar framed below the Screen, so that the Screen never hides me.
6. As a Player on a touch device, I want an analogue stick, so that I can walk in four directions with my thumb.
7. As a Player on a touch device, I want holding the stick to keep walking and sliding it to change direction, so that moving feels as fluid as the keyboard.
8. As a Player with Chat closed, I want speech bubbles and an unread indicator on the Chat button, so that I notice conversation without the history covering the world.
9. As a Player on a phone, I want Chat to open as a sheet with the history and the Message input, so that I can read and reply.
10. As a Player on a phone, I want Queue and Players as tabs next to Chat, so that I reach them without more buttons on the world.
11. As a Player typing on a phone, I want the Message input to stay above the on-screen keyboard and the Screen to stay visible, so that I can type and still see what is on air.
12. As a Player on a phone, I want Wardrobe and Settings buttons, so that I can change my avatar, language and theme.
13. As a Player on a touch device, I want a mute button next to Now playing, so that I can silence the room.
14. As a Player on a phone held sideways, I want to be asked to rotate the device, so that the room is never shown squeezed.
15. As a Player whose viewport changes (rotation, window resize), I want to stay connected with my open panel and the Screen untouched, so that music and presence never restart.
16. As a Player on a touch tablet in landscape, I want the desktop layout with the analogue stick, so that I can walk without a keyboard.
17. As a Player in a narrow desktop window, I want the compact layout without the stick, so that the keyboard keeps working and nothing overlaps.
18. As a Player on a phone with a notch or gesture bar, I want no control hidden under them.
19. As a Player on a phone, I want the home page to let me choose a nickname and avatar, so that I can join.

## Implementation Decisions

### Layouts and when they apply

- **Compact layout**: viewport width < 1024 px or height < 640 px. **Desktop layout**: otherwise, unchanged from ADR-0014.
- The compact layout is portrait only. When height < 500 px and width > height, a "rotate your device" notice covers the room.
- Minimum compact width is 360 px, the narrowest at which a 16:9 Screen is at least 200 px tall (YouTube Required Minimum Functionality, ADR-0006). Narrower viewports show the compatibility notice.
- Either notice keeps the connection and in-memory state, and pauses the Screen while it is covered. Uncovering resumes it in sync through the existing server-clock sync (ADR-0004). The desktop notice gets the same pause; today it hides a still-playing iframe with `visibility: hidden`.
- The touch movement control is shown when the primary pointer is coarse (`pointer: coarse`), independently of the layout. Keyboard movement keeps working everywhere.
- One component tree serves both layouts. Layout differences are CSS (Tailwind breakpoints and media queries) only. Changing layout must never unmount the Screen's iframe, the canvas or the room connection, and keeps the open panel: desktop Chat, Queue and Players panels map one-to-one to the sheet's tabs, and an open Wardrobe stays open.
- No Fullscreen API: "full viewport" means `100dvh`, as on desktop.
- `viewport-fit=cover`. The Screen starts below `env(safe-area-inset-top)`. Bottom controls respect `env(safe-area-inset-bottom)`. The world extends to the edges.

### Pixel scale and camera (ADR-0017)

- The world is drawn at the smallest whole number of physical pixels per art pixel that is at least `ceil(2 × devicePixelRatio)` and covers the viewport. Its CSS scale is that number divided by the device pixel ratio. Examples: DPR 1 → 2 (2×), DPR 2 → 4 (2×), DPR 2.625 → 6 (≈ 2.29×), DPR 1.25 → 3 (2.4×).
- The world's position is rounded to whole physical pixels, not CSS pixels.
- This replaces ADR-0015's "at least 2× in CSS pixels" rule in every layout. Following the player and clamping to the Map's edges are unchanged.
- The camera centres the local player in a **visible area**: the viewport minus a top inset the app passes to the engine (the Screen and Radio strip height in the compact layout, 0 on desktop). Clamping to the Map still uses the whole viewport, so the world keeps covering the area behind the Screen.

### Compact room interface

- The Screen sits at the top, full width, 16:9, with nothing drawn over it. A thin Radio strip sits just below it, not overlapping it: Now playing and, on coarse pointers, a mute toggle instead of the volume slider. Before building the mute toggle, confirm against YouTube IFrame API docs whether `setVolume` has any effect on iOS. If it does, reconsider the slider.
- Bottom left: two icon-only buttons, stacked: Wardrobe and Settings. Settings opens the existing language and theme controls.
- Bottom centre: the analogue stick (coarse pointers only).
- Bottom right: the Chat button, carrying the unread indicator.
- With Chat closed there is no Message input. Speech bubbles remain the transient preview.
- The Chat button opens a **sheet** covering the area below the Radio strip, with tabs Chat, Queue and Players, opening on Chat. The Message input sits at the bottom of the Chat tab only. It is not autofocused. A close (X) control in the sheet's header closes it. Opening the Chat tab clears the unread indicator.
- The Wardrobe opens as the same kind of sheet below the Radio strip.
- While a sheet is open, the stick and the floating buttons are hidden and the player does not walk (the existing `walking` flag).
- On-screen keyboard: the Screen stays at the top, the sheet's history shrinks, and the Message input stays just above the keyboard. Use `interactive-widget=resizes-content` in the viewport meta for Chromium, and size the sheet from `window.visualViewport` for iOS Safari, which ignores that key.
- The one-interface-at-a-time rule of ADR-0014 still holds.

### Desktop layout with a coarse pointer

- The stick sits above the bottom-left Wardrobe and Settings buttons, clear of the centred Message input and the bottom-right panel controls.

### Analogue stick

- A DOM component in `apps/web/src/features/room/`, fixed at the bottom centre. It does not float to where the thumb lands.
- A pure function turns the thumb's offset into a direction or `null`: a dead zone around the centre, then the dominant axis. Add a little hysteresis near the diagonals so the direction does not flicker.
- The engine gains `steer(direction | null)`, which drives the same `StepRepeater` as the keyboard. It presses the new direction, releases the old one, and releases on `null`. A tap past the dead zone takes one Step, holding repeats with the keyboard's delay and interval, and sliding changes direction without lifting.
- `pointerup`, `pointercancel` and lost pointer capture steer `null`.
- The engine stays unaware of touch.
- The stick and the floating buttons use `touch-action: none` and `user-select: none`, and suppress the long-press context menu.
- No tap-to-walk on the Map.

### Home page

- The home page (nickname, avatar editor, join) works down to 360 px wide.
- Remove `DesktopOnlyNotice` and the `home.desktopOnly` message.

### Cross-cutting

- English and Brazilian Portuguese parity for every new accessible name, label and notice.
- Every icon-only control has an accessible name. The unread indicator does not rely on colour alone.

## Testing Decisions

- **Camera**: extend the pure camera tests with device pixel ratios 1, 1.25, 2, 2.625 and 3. Assert a whole number of physical pixels per art pixel, coverage, physical-pixel-rounded offsets, and framing within the visible area under a top inset.
- **Stick**: unit-test the offset → direction function: dead zone, each axis, diagonals, hysteresis.
- **Playwright**: add mobile projects using device profiles (a Pixel 7 and an iPhone 14, with `hasTouch` and `isMobile`) next to the desktop project, reusing the lobby entry fixture. Cover:
  - joining from a phone;
  - the canvas covering the viewport;
  - the Screen visible, unobstructed and at least 200 px tall at 360 px wide;
  - the avatar drawn below the Screen (via `drawnPlayers`);
  - walking with the stick (pointer events);
  - opening the sheet, switching tabs and sending a Message;
  - the unread indicator across two pages;
  - the Wardrobe sheet;
  - the rotate notice keeping the room connected;
  - resizing between layouts without a new join or an iframe reload.
- Assert behaviour and geometry, not Tailwind classes. No screenshot tests for pixel sharpness.
- Keep all existing desktop e2e green.

## Out of Scope

- Landscape layout on phones.
- The browser Fullscreen API, PWA install and home-screen mode.
- Tap-to-walk, diagonal movement, gestures such as swipe-to-close.
- Haptics.
- Changes to the server, protocol, movement rules or Radio sync.
- A dedicated Queue or Players button on the compact layout.

## Further Notes

- Glossary: nothing new. Layout, sheet and stick are interface terms, not domain language.
- ADR-0017 (pixel scale) and ADR-0018 (compact layout) are written as `proposed`. Tickets 01 and 02 accept them and update the statuses of ADR-0015 and ADR-0014.
