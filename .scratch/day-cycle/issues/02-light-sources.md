# 02 — Light sources declared on Tiled tiles

**What to build:** Replace the `lights` image layer with light sources declared on the objects tileset (ADR-0029). The `lamp` tile declares `glow = warm` and the `stage` tile `glow = stage`, each with the offset to the glow's centre. The map generator exports one light source per placed object, and the engine draws a glow (add blend) for each one in a light layer above the scene, outside the Ambient light. The `warm` glow is the v7 bundle's `brilho_poste_anim.png` (8 frames, 80×52, centred at the lamp's base − 32 px), on the same frame as the lamp's own flicker animation, scaled by the bundle's per-frame intensity `[1, 1, 1, 0.85, 1, 1, 0.35, 1]`. The `stage` glow is cut from the bundle's light layer. The Lamp glow level is the share of sources switched on: each source has a fixed threshold derived from its position and fades in or out when the level crosses it.

**Blocked by:** 06, 07

**Status:** ready-for-agent

- [ ] The `warm` glow strip and the `stage` glow come from the v7 bundle, normalized into `assets/map/plaza-v2/` and served from `public/sprites/plaza-v2/`.
- [ ] The generator reads the `glow` property and its offset from tile properties, exports the light sources, and fails on an unknown kind. `lights.png` is removed from the generator, the Tiled map and `public/`.
- [ ] Thresholds are deterministic per position and spread over [0, 1), so the share switched on follows the level. Unit-tested.
- [ ] A source fades over a short time when crossing its threshold, and a lit lamp's glow follows its lamp's flicker frame and intensity. Under reduced motion the lamp holds its first frame and the glow stays steady. Unit-tested through the timeline functions.
- [ ] At night the glows sit where the bundle's `camada_3_luzes.png` puts them.
- [ ] `pnpm check` is green.
