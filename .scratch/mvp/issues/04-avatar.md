# Avatar

Status: ready-for-agent
Type: task
Blocked by: 03

## What

Layered avatar sprites replace the dots, with walking animation per direction. The home page gets the avatar editor; in the room a HUD button or `C` opens the wardrobe panel with the same editor.

See [spec](../spec.md): Avatar and nickname, Layout and keyboard.

## Acceptance criteria

- [ ] `packages/avatar` models an avatar as a skin tone (6), a hair (8) and an outfit (6), and validates it; the sprite manifest matches the files in `apps/web/public/sprites/` (see `ASSETS.md`).
- [ ] Layers draw body, outfit, hair from bottom to top, over the shadow.
- [ ] Every layer is mandatory; the server rejects an invalid avatar.
- [ ] Wardrobe: changes preview locally; "Wear" (or closing with pending changes) applies them for everyone and saves them to `localStorage`.
- [ ] The server accepts at most one avatar change every 2 seconds per player.
- [ ] The panel never covers the screen column; the player does not move while it is open; `Esc` closes it.

## Notes

Every sheet uses 32×32 frames in 24 columns: 4 directions of 6 walking frames. Columns 0–5 face down and 12–17 face up; 6–11 and 18–23 are exact mirror images of each other, the two sides, so check by eye which one faces left. The body is about 14×28 px inside its frame.
