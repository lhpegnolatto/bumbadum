# 01 — Carousel Wardrobe editor

**What to build:** Replace the tabbed avatar editor with the carousel editor, on the home page and in the room's Wardrobe, and resize the Wardrobe panel. See the spec's "Carousel editor" and "Wardrobe panel" sections, without the Nickname field (that is 02).

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] shadcn's Carousel is added, with `embla-carousel-react` pinned to an exact version, and passes Biome.
- [x] Nine pixel-art layer icons in one `tablist` row, grouped by family, each with a translated accessible name and tooltip.
- [x] One carousel per layer, opening on the worn card: centred card = worn in the draft, tap to centre, ‹ › and ← →, no loop, "none" first on optional layers, skin tone as four cards.
- [x] The centred card is the preview (scale 4, animated, lifted). It is never clipped and there is no separate preview.
- [x] Swatches recolour the centred style and are hidden for skin tone, "none" and single-colour styles.
- [x] Animations of at most about 200 ms, off under reduced motion.
- [x] The Wardrobe keeps its placement, is capped at 34rem wide with a content-fitting height on desktop, and has Cancel beside Apply. Cancel, X, Esc and C discard the draft.
- [x] The home form uses the same editor below the Nickname field.
- [x] ADR-0023 records the carousel Wardrobe, and ADR-0019 becomes `superseded by ADR-0023`.
- [x] en and pt-BR strings are complete.
- [x] `pnpm check` and `pnpm test:e2e` pass, with `avatar.spec.ts` and `wardrobe-settings.mobile.spec.ts` updated to the carousel.

## Comments

Prototype: branch `prototype/wardrobe-carousel`, commit `1e286fb` (`apps/web/src/features/avatar/wardrobe-prototype.tsx`, variant C). It is prototype code: rewrite it, do not merge it.

## Answer

The avatar editor (`apps/web/src/features/avatar/avatar-editor.tsx`) is now one `tablist` row of nine pixel-art icons (`layer-icons.tsx`, 12×12 grids drawn as one SVG path, with tooltips), a carousel per tab and colour swatches. Each tab mounts a fresh shadcn Carousel (`embla-carousel-react` 8.6.0, `align: "center"`, `containScroll: false`, no loop) that opens on the worn card. Embla's `select` is the only way the centred card changes the draft. A tap calls `scrollTo`, and the ‹ › buttons and ← → move the centre. The cards are `basis-20` and show the full avatar at scale 2. The centred card is drawn at scale 4, animated and lifted, and it is the preview. Swatches are sr-only radios in round labels, named "{style}, {color}" as before. Their colours come from `swatches.ts`: the middle shade of the hair or fabric palette in `assets/avatar/palettes.json`, plus a table for the colours only material wearables come in, sampled from their sprites. A unit test checks that every catalog option has a swatch. The generated `carousel.tsx` uses a `section`, `ul` and `li` instead of ARIA roles, which Biome rejects, and takes its button names from the caller (translated "Previous style"/"Next style"). The Wardrobe header holds the title and the X. The footer holds Cancel and Apply. On desktop the panel is capped at 34rem wide and as tall as its content. C now toggles the Wardrobe, so Cancel, X, Esc and C all discard. The hint line is gone. The home editor column widened to `sm:w-96` so the nine icons fit in one row there.

ADR-0023 records the carousel Wardrobe, and ADR-0019 is superseded. `pnpm check` passes. `pnpm test:e2e` passes (53). `avatar.spec.ts` now covers the tabs, cards, arrows, arrow keys, a tap in view, swatches and the four discards, and the phone specs pick cards instead of radios. A shared `e2e/avatar-editor.ts` helper centres a card through its click handler, because a card beyond the clipped edge cannot be reached by a pointer.

Deviations: below about 400px the icon families wrap as wholes into a second row, because nine 44px touch targets do not fit one row on a 360px phone. The phone spec now waits for the icons' pop-in animation before measuring touch targets.

