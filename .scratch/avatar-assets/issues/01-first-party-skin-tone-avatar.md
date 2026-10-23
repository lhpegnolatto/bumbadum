# 01 — Replace the avatar with four first-party skin tones

**What to build:** Replace the layered MetroCity avatar with the project's first-party avatar sheets and make skin tone the avatar's only current appearance choice. Players choose one of four skin tones before joining, their choice crosses the client-server boundary, and everyone in the room sees the corresponding avatar. Existing browser settings migrate without losing nickname, locale, volume or mute preferences.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] The avatar domain and room protocol represent an avatar as one skin tone numbered 1–4, and the server rejects invalid new values.
- [x] A first visit starts with the existing random setup flow, now choosing among four skin tones, while the fallback avatar is skin tone 1.
- [x] Stored avatars with skin tones 1–4 retain their tone; old tones 5–6 become tone 1; obsolete hair and outfit values are discarded on the next settings write without changing the settings key.
- [x] Joining and changing an avatar still synchronizes the selected skin tone to every player in the room.
- [x] The first-party sheets render the correct skin-tone row and facing block, with left produced by mirroring right and the frame anchored at the centre of the feet at native size.
- [x] The MetroCity images and licence file are removed, and no shadow is drawn.
- [x] Domain, protocol, server, web and game-engine tests covering the changed behaviour pass in `pnpm check`.

## Answer

The avatar contract is now `{ skinTone }`, validated from 1 through 4 across the domain, protocol and room. Existing settings retain valid tones, migrate legacy tones 5–6 to tone 1, and shed obsolete layers on their next write while retaining the `v1` key. The renderer uses the first-party 24×24 sheets at native size, maps the three directional blocks, mirrors right for left, and draws no shadow. The old MetroCity public files were removed. `pnpm check` passes, including the server integration suite when allowed to bind its local test port.

