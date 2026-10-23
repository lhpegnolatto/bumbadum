# Tileset research

Status: needs-triage
Type: research

## What

Find a tileset for floor, walls and furniture that matches the character sprites (32×32 frames, apparently the "Cozy People" pack) and whose licence allows use in a public web app. Not part of the MVP; the MVP map uses plain shapes.

## Acceptance criteria

- [ ] Candidates listed with licence terms quoted from the primary source.
- [ ] One recommended, with what attribution it needs.

## Answer

Use **shubibubi's [Cozy Interior](https://shubibubi.itch.io/cozy-interior), full version** ($3.99, or the $20 "all things cozy" bundle). It comes from the same artist as the character sprites, uses the same muted palette, and sits on the same 16 px grid: floors are 16×16, wallpapers 16×32, and a Cozy People character fills about one tile inside its 32×32 cell. It allows commercial use. Credit is optional, but credit shubibubi anyway.

The sprites already in `apps/web/public/sprites/` are the **paid full version** of [Cozy People](https://shubibubi.itch.io/cozy-people). Its free download is only one character walking left and right in purple, and the repo has far more than that. Both packs forbid redistribution: "can't be resold or redistributed even if modified". So, before the repo goes public:

- confirm that the project bought the full version;
- then keep the repo private, keep the PNGs out of git, or get written permission from shubibubi.

If the repo must be public with its assets inside, use Marie Pepo's [Cosy Cabin](https://marie-pepo.itch.io/cosy-cabin) instead: free, commercial use allowed, credit required.

Details, quotes and other candidates: [research/tileset.md](../research/tileset.md).
