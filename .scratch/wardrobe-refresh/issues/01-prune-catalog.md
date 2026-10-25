# 01 — Prune the wardrobe to the curated catalog

**What to build:** Remove every style outside the curated catalog in the spec, and repair stored avatars that wore one so returning players keep everything else they chose.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] The removed styles' canonical PNGs, generated catalog entries, atlas regions and en/pt-BR labels are gone; the curated styles keep their current colours for now.
- [x] The tunic/overalls incompatibility rule disappears with the tunic.
- [x] A stored avatar wearing a removed style is repaired layer by layer: optional layers lose the selection, required layers take the default avatar's choice, every other layer and the skin tone are kept.
- [x] The server keeps rejecting unknown IDs; the client only sends repaired avatars.
- [x] Domain tests cover the repair; `pnpm check` and `pnpm test:e2e` pass.

## Answer

The catalog now holds the 477 variants of the curated styles; removed styles, the retired-ID mechanism and the tunic/overalls rule are gone. `repairAvatar` in the avatar package repairs stored settings and room state layer by layer, and the server still accepts only current IDs. `pnpm check` passes. In `pnpm test:e2e`, 50 pass, including the wardrobe flow; `chat.spec.ts:46` fails on a Message input layout assertion that fails identically on a clean `main`, so it is outside this ticket.
