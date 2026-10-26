# 01 — Carousel Wardrobe editor

**What to build:** Replace the tabbed avatar editor with the carousel editor, on the home page and in the room's Wardrobe, and resize the Wardrobe panel. See the spec's "Carousel editor" and "Wardrobe panel" sections, without the Nickname field (that is 02).

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] shadcn's Carousel is added, with `embla-carousel-react` pinned to an exact version, and passes Biome.
- [ ] Nine pixel-art layer icons in one `tablist` row, grouped by family, each with a translated accessible name and tooltip.
- [ ] One carousel per layer, opening on the worn card: centred card = worn in the draft, tap to centre, ‹ › and ← →, no loop, "none" first on optional layers, skin tone as four cards.
- [ ] The centred card is the preview (scale 4, animated, lifted). It is never clipped and there is no separate preview.
- [ ] Swatches recolour the centred style and are hidden for skin tone, "none" and single-colour styles.
- [ ] Animations of at most about 200 ms, off under reduced motion.
- [ ] The Wardrobe keeps its placement, is capped at 34rem wide with a content-fitting height on desktop, and has Cancel beside Apply. Cancel, X, Esc and C discard the draft.
- [ ] The home form uses the same editor below the Nickname field.
- [ ] ADR-0023 records the carousel Wardrobe, and ADR-0019 becomes `superseded by ADR-0023`.
- [ ] en and pt-BR strings are complete.
- [ ] `pnpm check` and `pnpm test:e2e` pass, with `avatar.spec.ts` and `wardrobe-settings.mobile.spec.ts` updated to the carousel.

## Comments

Prototype: branch `prototype/wardrobe-carousel`, commit `1e286fb` (`apps/web/src/features/avatar/wardrobe-prototype.tsx`, variant C). It is prototype code: rewrite it, do not merge it.
