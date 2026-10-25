# 02 — Preview hair and fabric colours for approval

**What to build:** Derive base sheets and the two palettes (hair colours, fabric colours, each a ramp of shades) for every curated hairstyle and fabric wearable, and publish a preview page showing every style × colour on avatars in all four skin tones. Nothing in `assets/avatar/` changes yet.

**Blocked by:** 01

**Status:** resolved

- [x] The preview shows all 19 hairstyles × 12 hair colours and every fabric wearable × 12 fabric colours, including fixed secondary details (drawstrings, plaid, soles).
- [x] The 12 + 12 colours match the spec, in one slightly desaturated register.
- [x] The player approves or adjusts the ramps; the approved palettes are recorded for 03.

## Comments

Preview published (private artifact): https://claude.ai/artifact/KueM4a6uRdyiQ95LeWZBPP. Builder and analysis live in the session scratchpad (`palette/analyze.mjs`, `build-data.mjs`, `template.html`).

- Each colour is an OKLCH base (lightness, chroma, hue) expanded into a ramp: hair has highlight/base/shadow, fabric adds a deep shade (used only by plaid). Shadows pull hue toward 285°, highlights toward 85°.
- Slot roles come from the current variants: slots that change in every variant are the main colour, sorted by lightness. 3 slots map to highlight/base/shadow, 2 to base/shadow, 4 to all four shades; buzz-cut uses only the shadow and sneakers only the base. Colours identical in every variant (outline, hair ties, gold trims, white drawstrings) stay fixed.
- Two-tone styles take a fixed accent with a fallback when it matches the main colour: bomber-jacket black/gray, jacket white/black, backwards-cap, flat-brim-cap, beanie and bow-headband white/gray, top-hat black/red.
- "Copiar paleta" exports `hairColours`/`fabricColours` with each colour's OKLCH and hex ramp: the palette files for ticket 03.

Awaiting the player's approval or adjustments.

## Answer

The player approved the preview's defaults (intensity 1.00× for both palettes) and the accent rules as shown. Ticket 03 commits these ramps as `assets/avatar/palettes.json`:

| Hair colour | Ramp (highlight, base, shadow) |
|---|---|
| black | #5d5461 #413a47 #26212e |
| brown | #936e56 #785039 #5b3425 |
| light-brown | #ba9770 #a0774f #825939 |
| auburn | #b36a57 #98483c #762c2d |
| ginger | #e39660 #ca723c #a9522f |
| blonde | #fada99 #d9ba70 #bd9857 |
| platinum | #ffffff #e4dec8 #c6bda9 |
| gray | #c3c3cb #a3a4ac #85858d |
| pink | #fdacc5 #de8aab #b76e95 |
| blue | #6ea3da #5182c1 #43619f |
| purple | #a67fc4 #8560ac #5f488f |
| green | #7bb587 #50986b #287a59 |

| Fabric colour | Ramp (highlight, base, shadow, deep) |
|---|---|
| black | #57535e #3b3944 #201f29 #0f0e17 |
| white | #f8f5ed #d8d3cc #b7b2ab #a09a95 |
| gray | #b0b0ba #90919c #72727b #5d5d65 |
| beige | #dfcfb0 #c2ae8e #a38c71 #8c7660 |
| brown | #9c775f #825841 #623b2b #4b281e |
| red | #d86f5f #bc4945 #952a39 #77192e |
| pink | #f9afc5 #da8dab #b27093 #945d7f |
| mustard | #eac169 #d29e39 #b57a1f #9b631a |
| green | #7aa671 #528a54 #2a6b42 #135535 |
| blue | #6395d3 #4974ba #3b5296 #303c78 |
| navy | #4e6487 #35476e #22294d #141736 |
| purple | #9d76ba #7c58a3 #563e84 #3e2d6a |
