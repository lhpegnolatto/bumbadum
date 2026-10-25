# Wardrobe refresh and dances

Trim the wardrobe to a curated set, give every hairstyle and every fabric wearable the same colours, and let players dance together.

## Curated catalog

- **Hair (19):** afro, bun, buzz-cut, curly-fade, double-buns, dreads, emo-fringe, hime, long-pigtails, man-bun, mohawk, mullet, ponytail, quiff, short, side-part, side-ponytail, textured-crop, wavy.
- **Top:** basketball-jersey, bomber-jacket, cute-hoodie, hoodie, jacket, plaid-shirt, t-shirt, tank-top.
- **Bottom:** trousers, flared-skirt.
- **One-piece garment (overgarment):** dress, overalls, pinafore-skirt.
- **Footwear:** sneakers. **Neckwear:** chain. **Eyewear and headwear:** all current styles.
- Removed: hair bowl, chanel-fringe, long, pigtails, spiky; tops denim-jacket, graphic-tee, long-sleeve, ruffle-blouse, sailor-blouse, tunic; bottom joggers; overgarment polka-dot-dress; footwear boots; neckwear scarf. Their files, IDs and labels are deleted, not retired (ADR-0020).

## Colours

- **Hair colours (12):** black, brown, light-brown, auburn, ginger, blonde, platinum, gray, pink, blue, purple, green.
- **Fabric colours (12):** black, white, gray, beige, brown, red, pink, mustard, green, blue, navy, purple.
- One slightly desaturated register between the three current palettes (classic, streetwear, cute).
- Every hairstyle comes in every hair colour. Every fabric wearable comes in every fabric colour: all tops, bottoms, one-piece garments, sneakers, and headwear backwards-cap, cap, flat-brim-cap, beanie, short-beanie, bandana, bow, bow-headband, top-hat, wizard-hat.
- Secondary details (hoodie drawstring, plaid lines, soles) stay fixed or derive from the main colour. They are never a second choice.
- Material wearables keep their current colours: chain, crown, viking-helmet, straw-hat, round-glasses, sunglasses, cat-ears, floral-crown, heart-clip, headphones.
- Canonical assets become one base sheet per style plus the two palettes. The generator expands the colours (ADR-0022).

## Repairing stored avatars

Applied on the client, layer by layer, to the avatar read from local settings and to avatars drawn from room state (ADR-0020, ADR-0022):

1. Style exists, colour gone: nearest colour of the same style, from an explicit old → new colour table in the avatar package.
2. Style gone, optional layer: no selection.
3. Style gone, required layer: the default avatar's choice.

The server still rejects any avatar with an unknown ID.

## Dances

- A dance is a named, looping choreography built from existing idle/walk frames with direction, offset and mirroring (ADR-0021). The catalog of dances is data in the avatar package and ships with one dance, picked in a prototype.
- Player state holds `dance: <id> | null`, authoritative on the server and visible to everyone. Everyone performing the same dance moves in unison, phased by the server clock.
- Start: `/dance` (`/dançar`), the `F` key, or a mobile button beside the wardrobe button. `/dance <name>` is reserved for when more dances exist.
- Stop: any step intent, `/dance` or `F` again, or opening the wardrobe.
- Dancing works with or without music. It produces no announcement and is rate-limited like other player messages.
- Reduced motion shows a still dance pose.
- Command names match regardless of accents for every command (`/dancar` works).
