# Layered avatar wardrobe

Expand the first-party avatar from skin tone only to a layered appearance shared before joining and through the in-room wardrobe.

## Model

- An avatar has a skin tone and the layers Hair, Top, Bottom, Footwear, Overgarment, Neckwear, Eyewear and Headwear.
- Top and Bottom are required. Every other wearable layer supports no selection.
- Options have stable English kebab-case IDs. Published IDs are never reused; retired options remain renderable but are hidden from the editor.
- Tunics cover but preserve the selected Bottom. Overalls are an Overgarment over Top and Bottom.
- Tunics and overalls are incompatible. The editor disables the combination and the domain rejects it.
- New avatars randomize skin tone, Hair, Top and Bottom and start without other layers. Migrated avatars keep their valid skin tone and receive the fallback appearance.

## Assets and rendering

- Ship all 280 current first-party variants.
- Canonical assets use English kebab-case names and complete idle/walk pairs.
- A deterministic generator validates their 288×96 RGBA geometry and duplicated skin-tone rows, emits a typed catalog and two runtime atlases, and fails when generated outputs are stale.
- Repair the known empty lateral idle frame in trousers and boots in generated output. Preserve boundary-touching hats unless a visible defect is proven.
- Draw body → Bottom → Footwear → Top → Overgarment → Neckwear → Hair → Eyewear → Headwear.

## Experience and synchronization

- Use the complete editor both before joining and in the in-room wardrobe.
- Organize it into tabs by layer, then style and color, with a persistent animated preview.
- Wardrobe changes remain private until Apply. Apply publishes the complete avatar atomically and saves it locally. Close and Escape discard the draft.
- The server validates every complete avatar on join and change. Every player sees the same applied appearance.
- English and Brazilian Portuguese UI strings remain complete and equivalent.
