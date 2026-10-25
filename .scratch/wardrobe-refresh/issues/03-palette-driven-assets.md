# 03 — Generate every style in every colour from base sheets

**What to build:** Make one base sheet per style plus the approved palette file the canonical avatar assets, and have the generator expand every hairstyle into every hair colour and every fabric wearable into every fabric colour (ADR-0022). Material wearables keep one canonical pair per colour.

**Blocked by:** 02

**Status:** resolved

- [x] `assets/avatar/` holds one base pair per hairstyle and fabric wearable, the palette file, and the current per-colour pairs for material wearables.
- [x] The generator validates geometry and palette slots, fails on stale output, and emits `<style>-<colour>` IDs for every combination.
- [x] Stored avatars wearing a colour that no longer exists take the nearest colour of the same style, from an explicit old → new colour table in the avatar package.
- [x] The default avatar and random avatars use only current IDs; colour labels exist in en and pt-BR.
- [x] `CODING_STANDARDS.md` describes the base-plus-palette asset rule and points to ADR-0022, which becomes `accepted`.
- [x] `GLOSSARY.md` gains **Hair colour** ("One of the fixed colours every hairstyle is offered in. All hairstyles share the same hair colours." _Avoid_: dye, hair palette) and **Fabric colour** ("One of the fixed colours every fabric wearable is offered in, from clothing to caps and bows. All fabric wearables share the same fabric colours. Wearables made of other materials, such as a gold chain or a straw hat, keep colours of their own." _Avoid_: colourway, clothing palette).
- [x] `pnpm check` and `pnpm test:e2e` pass.

## Answer

43 hairstyles and fabric wearables are now one base pair each, painted in reserved key colours (`#d8d8d8`/`#a8a8a8`/`#787878`/`#484848` for the palette shades, `#d8d8ff`/`#a8a8ff`/`#7878ff` for the accent), plus `assets/avatar/palettes.json` with the approved ramps (`hairColors`, `fabricColors`) and accent rules (`{ accent, fallback }`). Every other pixel kept its original colour. The generator expands them into 556 variants in palette order and fails on missing keys, unknown accent colours, or accents for styles without a base pair. `repairAvatar` swaps a removed colour for the nearest current colour of the same style, from an explicit table, before the layer repair. ADR-0022 is accepted, `CODING_STANDARDS.md` describes the key colours, and the glossary has Hair colour and Fabric colour. `pnpm check` and `pnpm test:e2e` (51) pass.
