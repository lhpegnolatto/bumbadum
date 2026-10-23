# Avatar

Status: ready-for-agent
Type: task
Blocked by: 03

## What

Layered avatar sprites replace the dots, with walking animation per direction. The home page gets the avatar editor; in the room a HUD button or `C` opens the wardrobe panel with the same editor.

See [spec](../spec.md): Avatar and nickname, Layout and keyboard.

## Acceptance criteria

- [ ] `packages/avatar` models skin tone plus hair, top, bottom and footwear with their variants, and validates an avatar; the sprite manifest matches the files in `apps/web/public/sprites/`.
- [ ] Every layer is mandatory; the server rejects an invalid avatar.
- [ ] Wardrobe: changes preview locally; "Wear" (or closing with pending changes) applies them for everyone and saves them to `localStorage`.
- [ ] The server accepts at most one avatar change every 2 seconds per player.
- [ ] The panel never covers the screen column; the player does not move while it is open; `Esc` closes it.
