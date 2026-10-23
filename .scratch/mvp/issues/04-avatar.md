# Avatar

Status: resolved
Type: task
Blocked by: 03

## What

Layered avatar sprites replace the dots, with walking animation per direction. The home page gets the avatar editor; in the room a HUD button or `C` opens the wardrobe panel with the same editor.

See [spec](../spec.md): Avatar and nickname, Layout and keyboard.

## Acceptance criteria

- [x] `packages/avatar` models an avatar as a skin tone (6), a hair (8) and an outfit (6), and validates it; the sprite manifest matches the files in `apps/web/public/sprites/` (see `ASSETS.md`).
- [x] Layers draw body, outfit, hair from bottom to top, over the shadow.
- [x] Every layer is mandatory; the server rejects an invalid avatar.
- [x] Wardrobe: changes preview locally; "Wear" (or closing with pending changes) applies them for everyone and saves them to `localStorage`.
- [x] The server accepts at most one avatar change every 2 seconds per player.
- [x] The panel never covers the screen column; the player does not move while it is open; `Esc` closes it.

## Notes

Every sheet uses 32×32 frames in 24 columns: 4 directions of 6 walking frames. Columns 0–5 face down and 12–17 face up; 6–11 and 18–23 are exact mirror images of each other, the two sides, so check by eye which one faces left. The body is about 14×28 px inside its frame.

## Built

- `packages/avatar`: `parseAvatar`, `randomAvatar`, `DEFAULT_AVATAR` and the sprite manifest (`avatarFrames`, `SPRITE_SHEETS`). Choices are numbered from 1, as the pack's files are. Columns 6–11 face right; left is drawn as 6–11 mirrored, because the pack's first left frame of hairs 6–8 faces right (see `ASSETS.md`).
- Join options carry the avatar; an invalid one is rejected with `invalid-avatar`. `PlayerState.avatar` is an `AvatarState`; the `avatar` message carries a whole new avatar, rate-limited to one every 2 s per player and ignored when invalid.
- `localStorage` keeps the avatar under the same `bumbadum:settings:v1` key: it is an optional field, so older settings stay valid; an invalid stored avatar is dropped. A first visit starts from a random avatar; the room falls back to `DEFAULT_AVATAR` for settings saved before avatars existed.
- The client spaces avatar changes 2.25 s apart and sends only the latest waiting one, so the server's limit never drops a change.
- game-engine draws shadow, body, outfit and hair as sprites with their feet on the bottom of the tile, sorted by depth; walking plays the 6 frames over two steps, the idle frame shows when still. `setWalking(false)` stops the walking keys while the wardrobe is open.
