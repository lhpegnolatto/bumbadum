# 03 — Generate every style in every colour from base sheets

**What to build:** Make one base sheet per style plus the approved palettes the canonical avatar assets, and have the generator expand every hairstyle into every hair colour and every fabric wearable into every fabric colour (ADR-0022). Material wearables keep one canonical pair per colour.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] `assets/avatar/` holds one base pair per hairstyle and fabric wearable, the two palette files, and the current per-colour pairs for material wearables.
- [ ] The generator validates geometry and palette slots, fails on stale output, and emits `<style>-<colour>` IDs for every combination.
- [ ] Stored avatars wearing a colour that no longer exists take the nearest colour of the same style, from an explicit old → new colour table in the avatar package.
- [ ] The default avatar and random avatars use only current IDs; colour labels exist in en and pt-BR.
- [ ] `CODING_STANDARDS.md` describes the base-plus-palette asset rule and points to ADR-0022, which becomes `accepted`.
- [ ] `GLOSSARY.md` gains **Hair colour** ("One of the fixed colours every hairstyle is offered in. All hairstyles share the same hair colours." _Avoid_: dye, hair palette) and **Fabric colour** ("One of the fixed colours every fabric wearable is offered in, from clothing to caps and bows. All fabric wearables share the same fabric colours. Wearables made of other materials, such as a gold chain or a straw hat, keep colours of their own." _Avoid_: colourway, clothing palette).
- [ ] `pnpm check` and `pnpm test:e2e` pass.
