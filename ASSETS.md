# Third-Party Assets

This project uses third-party assets under their respective licenses.

## MetroCity — Free Top Down Character Pack

- **Creator:** JIK-A-4
- **Source:** https://jik-a-4.itch.io/metrocity-free-topdown-character-pack
- **License:** [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/)
- **License status:** Public domain dedication
- **Commercial use:** Allowed
- **Modification:** Allowed
- **Redistribution:** Allowed, including the original asset files
- **Attribution:** Not required; credit is appreciated

The MetroCity character assets are distributed under the CC0 1.0 Universal license, as indicated on the creator's official asset page.

The assets are provided separately from this project's source code and may be subject to different licensing terms than the code itself. The licence text is in `apps/web/public/sprites/LICENSE.txt`.

### Files

The pack lives in `apps/web/public/sprites/`, renamed to kebab-case. Every sheet uses 32×32 frames in 24 columns: 4 directions of 6 walking frames each.

| In this repo | In the pack | Contents |
|---|---|---|
| `body.png` | `CharacterModel/Character Model.png` | One row per skin tone (6) |
| `shadow.png` | `CharacterModel/Shadow.png` | A single 32×32 shadow |
| `hairs.png` | `Hair/Hairs.png` | One row per hair (8), each with its own colour |
| `outfits/outfit-1.png` … `outfit-6.png` | `Outfits/Outfit1.png` … `Outfit6.png` | One row per outfit |

The pack's single-frame `Hair/Hair*.png` files are left out: each one is the first frame of a row of `Hairs.png`.

### Credits

Thanks to **JIK-A-4** for creating and sharing the MetroCity character asset pack.
