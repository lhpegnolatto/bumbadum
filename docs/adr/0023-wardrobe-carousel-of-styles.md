---
status: accepted
---

# The Wardrobe is a carousel of styles

The Wardrobe opens on one row of nine pixel-art icons, one per choice: skin tone, hair; top, bottom, one-piece; footwear, neckwear, eyewear, headwear. Body, Clothing and Accessories survive only as visual gaps between the icons, and a narrow phone wraps a family as a whole. Each icon shows that choice's styles as a carousel of full-avatar cards. The centred card is the style the draft wears, drawn larger as the preview, so swiping, the arrows or the arrow keys try styles on. Tapping a card centres it. Optional layers start with a "none" card, and skin tone is a carousel of its four tones. The colours of the centred style are swatches below the carousel, hidden when it comes in one colour. The avatar domain keeps its render layers: dresses and pinafore-style garments stay one-piece garments represented by `overgarment`, with the top and bottom kept underneath. The same editor serves the home page, the desktop Wardrobe and the compact sheet; on desktop the Wardrobe is at most 34rem wide and as tall as its content. This supersedes ADR-0019, whose nested tabs and grids of colour thumbnails took several taps to reach a layer and a long scroll to pick a colour on a phone.

## Considered options

- Keeping ADR-0019's nested tabs with the carousel inside: fewer icons to draw, but still two taps to reach most layers.
- One card per style and colour: every variant one tap away, but hundreds of near-identical cards (19 hairstyles in 12 colours alone).
- Garment-only artwork on hangers, as in the first sketch: closer to the sketch, but small accessories are unreadable on their own and every wearable needs new art.
- A separate preview above the carousel: rejected in the prototype, because the enlarged centred card already shows the look and a phone has no height to spare.
- A bottom drawer over the world: rejected in the prototype in favour of the existing placement (ADR-0014, ADR-0018).
