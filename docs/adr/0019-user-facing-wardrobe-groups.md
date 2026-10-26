---
status: superseded by ADR-0023
---

# Group wardrobe choices by user-facing families

The Wardrobe presents choices as **Body → Hair → Clothing → Accessories**, with compact secondary tabs inside Clothing (**Top → Bottom → One-piece**) and Accessories (**Footwear → Neckwear → Eyewear → Headwear**). The avatar domain keeps its existing render layers: new hair assets enter `hair`, clothing assets enter `top`, `bottom` or `overgarment`, and decorations enter `headwear`. Dresses and pinafore-style garments are one-piece garments represented by `overgarment`; the existing top and bottom selections remain preserved underneath while the one-piece garment is being tried. Every variant is previewed as a clickable full-avatar thumbnail, and the same editor is reused in the desktop panel and compact mobile sheet. This keeps persisted avatar identities stable while making the editor understandable on small screens and for non-technical players.

## Considered options

- Exposing every render layer as a top-level tab: accurate to the domain model, but makes the Wardrobe harder to scan and forces users to understand implementation terms such as `overgarment`.
- Adding a new generic accessory or dress layer: more expressive, but would change the persisted avatar model and the server/protocol contract for assets that can be represented by existing render layers.
