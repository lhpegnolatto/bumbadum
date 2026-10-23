# 03 — Adapt the wardrobe for incremental customization

**What to build:** Keep the in-room wardrobe useful while only skin tone is available. Players can preview and apply a tone, see which appearance categories are coming later, and leave without accidentally publishing a draft.

**Blocked by:** 01 — Replace the avatar with four first-party skin tones.

**Status:** resolved

- [x] The wardrobe offers the four functional skin tones and presents Hair, Outfit and Accessories as non-focusable “Coming soon” information.
- [x] The primary action is “Apply” in both supported languages and publishes the draft skin tone to the room.
- [x] Closing with the close button or Escape cancels the draft and leaves the worn avatar unchanged.
- [x] Opening the wardrobe continues to suspend directional movement until it closes.
- [x] The join page shows only the functional skin-tone selector, without the future-category placeholders.
- [x] A multi-player browser test proves that preview remains private, Apply synchronizes the new tone, cancellation publishes nothing, and the saved setting matches the applied tone.
- [x] `pnpm check` and `pnpm test:e2e` pass.

## Answer

The wardrobe now publishes only an explicitly applied skin tone, cancels drafts through its close button or Escape, and keeps movement suspended while open. Hair, Outfit and Accessories are non-focusable “Coming soon” information, while the join page remains focused on the functional skin-tone choice. The multi-player browser flow covers private preview, synchronization, persistence, cancellation and movement recovery. `pnpm check` passes all 16 tasks and `pnpm test:e2e` passes all 16 browser tests.
