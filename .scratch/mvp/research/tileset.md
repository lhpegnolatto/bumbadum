# Tileset and sprite licences

Research for [issue 11](../issues/11-tileset-research.md). Sources were read on 2026-10-23. Licence text is quoted exactly from each asset's own itch.io page (or the author's site). An itch.io asset page is the only licence these packs have; none of them links a separate licence document.

## 1. The character sprites already in the repo

### Identification: shubibubi, "Cozy People Asset Pack", **full (paid) version**

The sheets in `apps/web/public/sprites/` match the [Cozy People](https://shubibubi.itch.io/cozy-people) feature list on every point that can be checked:

| In the repo | On the Cozy People page / devlog |
|---|---|
| 32×32 cells, visible body about 14×20 px | "The sprites come in a 32x32 px layout to make layering clothing and hair as easy as possible." / "Character sprites are 20x16 px" |
| 8 frames per direction, 4 directions | "Walk (8 frames)" |
| `char.png`: 8 skin tones | The page still says "5 skin tones", but the [Halloween devlog (Oct 31, 2021)](https://shubibubi.itch.io/cozy-people/devlog/307909/hoe-animation-and-halloween) says: "Characters now come in 8 skin tones." |
| Hair `extra-long`, `gentleman`, 14 variants each | "13 hairstyles in 14 colors", listing "Extra long" and "Gentleman" |
| `shirt`, `dress`, `pants`, `skirt`, `shoes`, 10 variants each | "All clothes come in 10 colors", listing "Basic shirt", "Dress", "Pants", "Skirt", "Shoes" |
| Muted palette, dark outline | The same visual style as the pack's screenshots |

These are matches on features and style. The files were not compared byte for byte with the paid download, which this research did not buy.

**These sprites can only have come from the full version.** The free download is a 7.4 kB file, and the page says it contains only:

> "Free version includes Character2 walk left and right, shirt, pants, shoes and pumpkin hat in purple"

The repo has 8 skin tones, 4 walking directions, two hairstyles in 14 colours, and a dress, a skirt and a shirt in 10 colours. None of that is in the free download.

### The Cozy People licence (quoted exactly from <https://shubibubi.itch.io/cozy-people>)

> **Complete version license (paying at least $3.99):**
>
> This asset pack can be used in any commercial or non commercial project, you may modify the assets as you wish. This asset pack can't be resold or redistributed even if modified.
>
> **Free version license:**
>
> This asset pack can be used in any non commercial project, you may modify the asset as you wish. This asset pack can't be used in any commercial project, resold/redistributed, even if modified.
>
> Credit appreciated (this link)

"This link" points to <https://shubibubi.itch.io/>. The page marks the pack "No generative AI was used". It costs $3.99 or more (pay what you want from $3.99), or $20 in the [all things cozy bundle](https://itch.io/s/157466/all-things-cozy-bundle) with six other packs.

### What this means for bumbadum

- **Use in the app.** Allowed, commercially too, *if someone on the project paid $3.99 or more for the full version*. The free licence would not cover these files anyway, because they are not the free files.
- **Attribution.** Not required ("Credit appreciated"). Crediting shubibubi with a link in an about or credits screen costs nothing and is recommended.
- **Modifying.** Allowed ("you may modify the assets as you wish"), so recolouring and re-slicing are fine.
- **Redistribution: the real risk.** "can't be resold or redistributed even if modified." The licence does not mention source repositories. Every web game has to serve its PNGs to browsers, and serving them as part of the running app is the ordinary use the licence exists for. A **public git repository** that holds the sheets in `apps/web/public/sprites/` is different: anyone can clone the pack's files in a reusable form, separate from the game. That is the most likely reading of "redistributed". Right now the repo has no git remote, so nothing has been redistributed yet.

**Licence risks, from most to least serious:**

1. **Unknown provenance.** If nobody on the project bought the full version (for example, the files came from another repository), the app has no licence for them at all, commercial or not. Confirm the itch.io purchase and keep the receipt.
2. **Public repo.** If the repo goes public with these PNGs committed, that likely breaks "can't be ... redistributed". Options, cheapest first:
   - keep the GitHub repo private (Vercel and Render both deploy from private repos);
   - keep the sprites out of git (gitignore them) and fetch them at build time from private storage;
   - get written permission from shubibubi to keep them in a public repo, and save it next to the assets.
3. **Commercial use later.** Covered by the full-version licence, so there is no extra risk once the purchase is confirmed.

## 2. Matching scale

Cozy People draws a character about 1 tile wide and 1.25 tiles tall on a **16 px grid**, inside a 32×32 cell. A matching tileset is therefore a **16×16** one, not 32×32. `game-engine` should use 16 px tiles, centre each 32×32 frame on its tile with the feet on the tile's bottom edge, and scale up by whole numbers with nearest-neighbour filtering. The MVP's 20×15 map is 320×240 px at native size.

## 3. Tileset candidates

### A. shubibubi, "Cozy Interior Asset Pack" (recommended)

<https://shubibubi.itch.io/cozy-interior>. Same author, same muted palette. The Cozy People page says its palette "goes perfectly with Cozy Farm Asset pack and Cozy Interior Asset pack".

- Scale: "Wallpapers (16x32px)", "Flooring (16x16)". Furniture is built on the same 16 px grid. Some plants are 32x16, with "an additional 16x16 version".
- Contents: dozens of wallpapers and floors in many colours; living room, kitchen, bedroom, bathroom and kids' room furniture; lamps, plants, pets and electronics, including a "Radio", which suits bumbadum.
- Free download: "Dining table, small table, chair (4 directions), 2 wallpapers, wood floor, rug, shelf, plant, retro TV +2 programs, 1 candle, 1 painting, 2 movie posters".
- Price: $3.99 or more (full version, 3.3 MB). It is also in the $20 bundle.
- Licence, quoted exactly:

  > **Complete version license (paying at least $3.99):**
  >
  > This asset pack can be used in any commercial or non commercial project, you may modify the assets as you wish. This asset pack can't be resold or redistributed even if modified.
  >
  > **Free version license:**
  >
  > This asset pack can be used in any non commercial project, you may modify the asset as you wish. This asset pack can't be used in any commercial project, resold/redistributed, even if modified.
  >
  > Credit appreciated (this link)

- Note: the pack includes "19 movie posters (Clockwork Orange, ... Star Wars, Spirited Away)" and famous paintings. Parodies of real film posters carry trademark and copyright questions that the shubibubi licence cannot settle, so leave them out.

The same author's [Cozy Town](https://shubibubi.itch.io/cozy-town) ($7.99, the same licence wording) adds shop interiors such as a café and a community room. It is only worth buying if more rooms are wanted later.

### B. Marie Pepo, "Cosy Cabin" (best free fallback)

<https://marie-pepo.itch.io/cosy-cabin>. "A small tileset to be able to create your 16x16 cottagecore dream cabin through the different 4 directions furniture and structural elements", "This pack will fit perfectly for 16x16 or 16x32 characters!" It has walls, floors, and bedroom, bathroom, kitchen and living room furniture. It is warm and orange-brown, more saturated than Cozy People but in the same cozy style.

Licence, quoted exactly:

> This pack is free to use for personal and commercial use, with credits (Marie Pepo)
> You are free to copy, expand, modify the asset as you wish to!
> BUT you can't resell the asset as such, or with edits, thank you :)

It costs nothing, allows commercial use and **requires credit**. It forbids reselling but does not forbid redistribution, so it is safer than A in a public repo. It is a small set, far smaller than A.

### C. LimeZu, "Modern Interiors"

<https://limezu.itch.io/moderninteriors>. Huge, and "Available in 3 sizes (16x16, 32x32, 48x48)". The style is "Crisp minimal RPG", which is brighter, more saturated and higher-contrast than Cozy People. It also comes with its own character generator, so it would look mismatched next to Cozy People characters. Licence, quoted exactly:

> Complete version LICENSE (paying at least 1.50$):
> YOU CAN:
> - Edit and use the asset in any commercial or non commercial project
> -Use the asset in any commercial or non commercial project
> YOU CAN'T:
> - Resell or distribute the asset to others
> - Edit and resell the asset to others
> - Credits required (this link)

A recent comment on the page says the complete files now need $3, so the listed price may be out of date. The page does not give terms for the free version (`Modern_Interiors_Free_v2.2.zip`); they may be inside the zip, which this research did not download. Credit is required, and redistribution is forbidden just as in A.

### D. CC0 options (no licence risk, poor style match)

- **Kenney, "Roguelike Indoors"**: <https://kenney.nl/assets/roguelike-indoors>. "License: Creative Commons CC0". From <https://kenney.nl/support>: "all game assets on the asset pages are public domain licensed (CC0). You're free to use them, even in commercial projects." and "Attribution is not required". The asset page does not state the tile size. The style is flat and simple, far from Cozy People.
- **Pixel-Boy & AAA, "Ninja Adventure"**: <https://pixel-boy.itch.io/ninja-adventure-asset-pack>. 16×16, with "Tilesets ( Floor autotilling, exterior and interior element etc )". The page says: "They are released under the Creative Commons Zero (CC0) license. You can use any and all of the assets found in this package in your own games, even commercial ones. Attribution is not required but appreciated." The style is a bright fantasy RPG, not a cozy room.

Both could sit in a public repo. Neither looks like Cozy People.

### Ruled out

- **Cup Nooble, "Sprout Lands"** ([page](https://cupnooble.itch.io/sprout-lands-asset-pack)): a pastel 16-bit pack, but for farm exteriors. Its licence works like shubibubi's (paid: commercial use, no redistribution; free: non-commercial only).
- **413 Games, "Cozy Pixel Furniture"** ([page](https://413games.itch.io/cozypixelfurniture)): drawn side-on for platformers ("cozy furniture to decorate your platformer game with"), so it does not fit a top-down room.

## 4. Recommendation

Use **shubibubi's Cozy Interior full version ($3.99, or the $20 bundle)**. It is the only candidate drawn by the same artist in the same palette and on the same 16 px grid, and it covers floor, walls and furniture in depth. It allows commercial use, and credit is optional. Credit "shubibubi" with a link to <https://shubibubi.itch.io/> anyway, for both packs.

Its terms are the same as Cozy People's, so **the same rule applies to both: do not publish the PNGs in a public repository.** Keep the repo private, or keep the assets out of git, or get written permission from shubibubi. If the repo must be public with its assets inside, the fallback is Marie Pepo's Cosy Cabin (free, commercial use allowed, credit required, no ban on redistribution). In that case, credit "Marie Pepo".

## Open points

- Confirm that the project owns a full-version purchase of Cozy People. The repo's files are not the free version.
- Decide on the repo's visibility before it gets a remote.
- Not checked: LimeZu's free-version terms (inside the zip) and the tile size of Kenney's Roguelike Indoors.
