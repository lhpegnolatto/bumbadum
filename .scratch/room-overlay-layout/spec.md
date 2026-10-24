# Full-viewport room overlay layout

Status: ready-for-agent

## Problem Statement

The room currently gives a fixed 400 px side column to the Screen, Queue, Players and Chat, leaving the world inside a padded remainder of the viewport. The arrangement makes the game feel secondary, does not provide open and closed Chat states, and resizes the space available to the pixel-art world around permanently visible interface. Players need the world to remain the stable, full-viewport focus while the Screen, communication controls and configuration remain available without blurring pixels or obscuring required playback.

## Solution

Make the PixiJS canvas fill the browser viewport and render the complete temporary 4:3 Map at the largest whole-number scale that fits, centred over a world-appropriate background. Overlay a compact, desktop-only room interface: the always-visible Screen and Radio controls at the upper right; mutually exclusive Chat, Queue and Players panels below it; a Message input that moves between the bottom centre and the open Chat panel; panel controls at the lower right; and Wardrobe and Settings controls at the lower left. Preserve sharp pixel art, keyboard movement and the Screen's visibility while making all secondary panels opt-in.

## User Stories

1. As a Player, I want the world to fill my browser viewport, so that the room feels like the primary experience.
2. As a Player, I want the complete Map to remain visible, so that opening the room never hides reachable Tiles.
3. As a Player, I want pixel art rendered at a whole-number scale, so that sprites and Tiles remain crisp.
4. As a Player on a widescreen display, I want the Map centred within a world-appropriate background, so that unused space feels intentional rather than like black letterboxing.
5. As a Player, I want interface panels to overlay the world without resizing it, so that its scale and position never jump when I open a panel.
6. As a Player, I want the Screen always visible in the upper-right area, so that I can see the Track on air and playback continues to meet YouTube's display constraints.
7. As a Player, I want the Screen to remain 16:9 and at least 400×225 px, so that it is useful and compliant at every supported desktop size.
8. As a Player, I want a compact Radio bar beneath the Screen, so that I can see the Track and Submitter and control volume without opening another panel.
9. As a Player entering a room, I want no secondary panel open initially, so that I arrive focused on the world.
10. As a Player, I want dedicated Chat, Queue and Players controls at the lower right, so that I can open the information I need.
11. As a Player, I want only one room panel open at a time, so that overlapping interface does not crowd the world.
12. As a Player, I want the active panel control, its close control and Escape to close the panel, so that dismissal is predictable.
13. As a Player, I want clicking or moving in the world not to close an open room panel, so that I can keep information visible while walking.
14. As a Player, I want Chat history anchored beneath the Screen, so that the Screen remains visible while I follow the conversation.
15. As a Player, I want the Message input at the bottom centre while Chat is closed, so that sending a Message remains immediately available.
16. As a Player, I want the Message input to move to the bottom of the Chat panel while it is open, so that composing and reading form one coherent conversation area.
17. As a keyboard Player, I want Enter to focus the Message input and Enter after typing to send and return control to the world, so that chatting does not leave movement disabled.
18. As a keyboard Player, I want the first Escape to cancel text focus and a later Escape to close the open panel, so that I do not dismiss context accidentally.
19. As a Player with Chat closed, I want a visual indicator when a new Message arrives, so that I know there is unread conversation without an automatic interruption.
20. As a Player, I want opening Chat to clear its new-Message indicator, so that it reflects whether I have checked the conversation.
21. As a Player, I want avatar speech bubbles to remain the temporary preview of new Messages, so that nearby conversation stays connected to its sender.
22. As a Player, I want Queue in its own panel, so that upcoming Tracks remain available without permanently consuming screen space.
23. As a Player, I want Players in its own panel, so that room presence remains available without permanently consuming screen space.
24. As a Player, I want Wardrobe and Settings controls always visible at the lower left, so that personalization remains easy to find in every panel state.
25. As a Player, I want Wardrobe to use a wider overlay beside but never over the Screen, so that editing an Avatar has enough space without hiding playback.
26. As a Player, I want opening Wardrobe to close another open panel, so that the one-panel rule remains consistent.
27. As a Player, I want Settings to contain language and theme controls, so that room preferences are grouped in one predictable place.
28. As a Player, I want volume to exist only in the Radio bar, so that the same setting is not duplicated in Settings.
29. As a Player, I want room panel and unread-indicator state to reset after reloading or re-entering, so that temporary interface state is not mistaken for a saved preference.
30. As a Player, I want short panel transitions that respect reduced-motion preferences, so that the interface feels responsive without causing discomfort.
31. As a Player whose viewport becomes too small, I want a clear desktop compatibility notice, so that controls do not overlap or become unusable.
32. As a Player resizing back to at least 1024×640, I want the room to return without reconnecting, so that I remain present with my friends.
33. As a screen-reader or keyboard Player, I want every icon control to have an accessible name, active state and keyboard behavior, so that the interface does not depend on color or pointer input.

## Implementation Decisions

- Follow ADR-0014: the canvas owns the full viewport and the room interface overlays it. ADR-0010's fixed side column no longer applies.
- Keep this feature desktop-only. The supported room viewport is at least 1024×640; smaller dimensions display the existing desktop compatibility experience while preserving the room connection and client state.
- Do not use the browser Fullscreen API. Full viewport means the browser content viewport using dynamic viewport units.
- Keep the current temporary Map fully visible. Compute the largest whole-number scale that fits both dimensions, centre the scaled Map horizontally and vertically, and never stretch it non-uniformly or use fractional scaling.
- Let the PixiJS canvas fill all available viewport space. Fill the space outside the scaled Map with a background that belongs visually to the world rather than black bars or DOM interface.
- Keep nearest-neighbour texture scaling, disabled antialiasing and rounded rendered pixels.
- Treat interface visibility as a single ephemeral panel state with no panel selected initially. Chat, Queue, Players and Wardrobe are mutually exclusive; Settings is a compact preference popover and must not allow conflicting overlays.
- Keep opening or closing DOM interface independent of the canvas dimensions, Map scale and Map position.
- Size the right overlay column with `clamp(400px, 32vw, 480px)`. The Screen and the narrow room panels share that width.
- Keep the Screen fixed at 16:9 and never smaller than 400×225 px. Nothing may render over it.
- Place an always-visible, compact Radio bar immediately below the Screen. It contains Now playing information, the Submitter and volume controls.
- Reuse the region beneath the Screen for the active Chat, Queue or Players panel. The active panel fills the available vertical space without moving the Screen or Radio bar.
- Place Chat, Queue and Players controls as one lower-right control group. Give each icon an accessible name, tooltip and selected/expanded state; the new-Message indicator must not rely on color alone.
- Show a visual new-Message indicator, not a count. Set it when a Message arrives while Chat is closed and clear it when Chat opens. Existing speech bubbles remain unchanged as the transient in-world preview.
- Keep the Message input mounted and usable in both Chat states. Position it at the lower centre when Chat is closed and in the Chat panel footer when Chat is open.
- Enter focuses the Message input when the world owns keyboard control. Submitting sends, clears the input and returns keyboard control to the world without closing Chat. Escape first removes text focus; when no text field owns focus, Escape closes the active panel.
- Do not close a panel because the Player clicks or walks in the world. The panel's own control, close control and Escape are the explicit dismissal mechanisms.
- Place Wardrobe and Settings controls in a persistent lower-left group. Preserve the `C` Wardrobe shortcut.
- Render Wardrobe in a wider overlay over the world but constrained so that it never intersects the Screen. Opening it closes any narrow room panel; closing or cancelling it retains the existing draft-discard behavior.
- Put language and theme in Settings. Keep volume exclusively in the Radio bar. Continue persisting language, theme and volume through the existing validated local settings; do not persist panel or unread state.
- Use the project's shadcn/ui primitives and visual conventions. The supplied references define behavior and rough placement, not exact dimensions or styling.
- Animate panel and popover entry/exit for approximately 150–200 ms. Disable or substantially reduce those transitions when the player prefers reduced motion. Never animate canvas scale in response to panel state.
- Retain English and Brazilian Portuguese parity for every new accessible name, tooltip, notice and label.
- Preserve the existing connection while the compatibility notice is displayed during a resize. Restore the room UI from its current in-memory state when the viewport becomes supported again.

## Testing Decisions

- Test external behavior and accessibility rather than Tailwind classes, component internals or a specific shadcn primitive. Geometry assertions should express the layout contract: viewport coverage, non-overlap, stable canvas bounds and supported minimums.
- Use Playwright through the existing lobby entry fixture as the principal seam. Extend the current room, Chat, Avatar and theme coverage rather than introducing a second browser harness.
- In Playwright, verify that the canvas container covers the full supported viewport and retains identical bounds while Chat, Queue, Players and Wardrobe open and close.
- Verify that the Screen remains visible, at least 400×225 px and unobstructed in every panel state, including Wardrobe.
- Verify that no panel is open initially; Chat, Queue, Players and Wardrobe are mutually exclusive; each supported dismissal route works; and clicking or walking in the world does not dismiss the active panel.
- Verify the Message input's two positions and keyboard lifecycle: Enter focuses, typing does not move the Player, submit clears and releases focus, first Escape releases text focus, and subsequent Escape closes the panel.
- Use two joined browser pages to verify that a new Message received with Chat closed sets the visual indicator, opening Chat clears it, and the Message remains in Chat history. Assert the control's accessible state rather than badge color.
- Verify Settings exposes language and theme, the Radio bar retains volume, and persisted preferences continue to work without persisting panel or indicator state.
- Verify a viewport below 1024×640 shows the compatibility notice without leaving the Room, and restoring a supported viewport returns the connected room without another join.
- Verify reduced-motion emulation removes or reduces panel transition motion without changing final visibility.
- Add a small pure seam in the game engine for Map fitting. Unit-test representative 4:3, widescreen, tall and minimum supported viewports, asserting an integer scale, complete fit and centred offsets.
- Keep pixel rendering configuration covered at the pure configuration/calculation boundary where practical; do not add screenshot tests for pixel sharpness.
- Preserve existing end-to-end coverage for walking, shared Messages, Wardrobe draft behavior, Radio focus restoration and multi-player presence.

## Out of Scope

- Mobile or tablet layout, touch movement controls and mobile-specific interaction design.
- Use of the browser Fullscreen API.
- Redesigning, expanding or replacing the temporary 320×240 Map.
- Changing world movement, collision, authoritative server behavior or room protocol.
- Changing Radio synchronization, Track lookup, Queue rules or YouTube integration.
- Persisting open panels or unread Message state.
- Adding a numeric unread count, notification toast or automatic opening of Chat.
- Reworking avatar speech bubbles beyond preserving their current behavior.
- Exact imitation of the colors, proportions or styling in the reference wireframes.

## Further Notes

- The two reference images are behavioral wireframes for Chat open and closed states.
- The pre-room Avatar setup remains unchanged. Once inside the room, no panel opens automatically.
- The current Map size is temporary, so the implementation should keep fitting logic independent of its present dimensions.
- After this specification, the full project workflow proceeds to tracer-bullet implementation tickets and then implementation with TDD and final code review.
