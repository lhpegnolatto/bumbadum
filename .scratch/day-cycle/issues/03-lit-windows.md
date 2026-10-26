# 03 — Lit windows on buildings and the food truck

**What to build:** `building-cafe`, `building-brick` and `food-truck` gain a window mask: an image the size of the tile holding only its lit window pixels, declared through the tile's `windows` property (ADR-0029). The generator packs the masks in the atlas and attaches each mask's frame to the object's light source. The engine draws them in the light layer, outside the Ambient light, switched on and off like any other light source, following the lit-windows level.

**Blocked by:** 02

**Status:** resolved

**Occlusion:** the light layer sits above every Player and Car, and the tiles in front of buildings are walkable. Each window mask is cut by an inverse mask of the silhouettes of the Players and Cars drawn in front of its object (greater depth), rebuilt every frame, so a lit storefront never covers an Avatar on the sidewalk.

- [x] Each window mask is the difference between the v7 bundle's `camada_2_objetos_dia.png` and `camada_2_objetos_noite.png` within the object's rectangle, extracted during normalization and reviewed by inspection of the generated assets.
- [x] The generator validates the generated window mask asset and its tile-sized placement.
- [x] Windows come on and off one by one with the lit-windows level, and keep their colour while the plaza darkens.
- [x] A Player or Car in front of a lit window is not covered by it; inverse silhouette masking is rebuilt each frame and ignores invisible avatars.
- [x] `pnpm check` is green.
