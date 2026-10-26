# Wardrobe carousel and nickname change

## Problem Statement

The Wardrobe asks for too many steps. A Player picks one of four section tabs, then (for Clothing and Accessories) a second row of layer tabs, then a style from a grid, then a colour from a second grid of whole-avatar thumbnails. On a phone that is a long scroll of near-identical thumbnails, and nothing about it feels like trying clothes on.

A Player also cannot change their Nickname without leaving the room: it is fixed by the join options, and the server reads it from there for every chat message and Announcement.

## Solution

The Wardrobe becomes a carousel of styles. A single row of nine pixel-art icons, one per layer, gives each layer in one tap. Below the icons, the layer's styles sit side by side as small full-avatar cards. The centred card is the style being worn in the draft, grown and lifted so it serves as the preview. Swiping, the arrows or ← → move the centre, and tapping a card centres it. A row of colour swatches below recolours the centred style. The same editor replaces the current one on the home page and in the room.

In the room, the Wardrobe also holds the Player's Nickname. A new Nickname is part of the draft: Apply publishes it, everyone sees the new name at once, and the chat announces the change.

The feel was settled in a throwaway prototype, kept on the `prototype/wardrobe-carousel` branch (commit `1e286fb`). Variant C won, with these adjustments: the panel keeps its current placement, it is capped on desktop, the cards get headroom above them, and the Nickname field is labelled.

## User Stories

1. As a Player, I want every layer one tap away, so that changing my shoes does not take three taps through nested tabs.
2. As a Player, I want to swipe through styles and see each one on my avatar as it reaches the centre, so that trying clothes on feels immediate.
3. As a Player, I want to tap a card to bring it to the centre, so that I can jump to a style I can already see.
4. As a Player on a desktop, I want arrow buttons and ← → keys on the carousel, so that I can browse without a touchpad.
5. As a Player, I want the carousel to open on what I am wearing, so that I start from my current look.
6. As a Player, I want a "none" card first on optional layers, so that I can take a hat or glasses off.
7. As a Player, I want colour swatches for the centred style, so that I pick the style first and then its colour without scanning a grid of thumbnails.
8. As a Player, I want the swatches to keep my colour when I change style, so that a blue t-shirt becomes a blue hoodie.
9. As a Player, I want no swatches for a style with a single colour or for "none", so that I am not offered a choice that does nothing.
10. As a Player, I want my skin tone as four cards in the same carousel, so that every layer works the same way.
11. As a Player, I want short animations when the Wardrobe opens and when I switch layer, and none under reduced motion.
12. As a Player, I want nothing to change for the room until I press Apply, so that I can experiment privately.
13. As a Player, I want Cancel, the X, Esc and C to close the Wardrobe and discard my draft, so that I can back out.
14. As a Player on a desktop, I want the Wardrobe no larger than its content, so that it does not cover the room with empty space.
15. As a Player, I want to change my Nickname from the Wardrobe while in the room, so that I do not have to leave and rejoin.
16. As a Player, I want Apply disabled, with a message, while my Nickname is invalid, so that I know why it will not apply.
17. As a Player, I want everyone to see my new Nickname over my avatar and in the player list at once.
18. As a Player, I want the chat to announce "Luiz is now Lu", so that others can follow who is who.
19. As a Player, I want earlier chat messages to keep the Nickname they were sent with, so that the history stays as it happened.
20. As a Player, I want my new Nickname remembered on this browser, so that I rejoin with it.
21. As a Player on the home page, I want the same carousel editor below the Nickname field, so that I learn one editor.

## Implementation Decisions

### Carousel editor (`apps/web`, ADR-0023)

- A new ADR-0023 records the carousel Wardrobe and supersedes ADR-0019. Its families survive only as visual grouping. The parts of ADR-0019 that still hold (render layers, one-piece garments as `overgarment`, the same editor everywhere) are restated there.
- The editor stays one component, used by the home form and the Wardrobe. Only the Wardrobe decides when a draft is published.
- Category icons: one `tablist` row of nine icons in layer order: skin tone, hair | top, bottom, one-piece | footwear, neckwear, eyewear, headwear. A small gap separates the three families. Each icon is a hand-drawn pixel-art SVG (`shape-rendering: crispEdges`, `currentColor`), with the layer's translated name as accessible name and tooltip. The prototype's 10×10 grids are a starting point.
- The carousel uses shadcn's Carousel (Embla), added with `embla-carousel-react` pinned to an exact version: `align: "center"`, `containScroll: false` so the ends can reach the centre, no loop, `startIndex` on the worn card. Embla's `select` event is the only way the centred card changes the draft. Tapping a card calls `scrollTo`. The ‹ › buttons are disabled at the ends. The carousel remounts per layer (keyed by layer) and slides in.
- Cards are fixed-width (`basis-20`), each showing the full avatar wearing that style (`AvatarSprite` at scale 2) with the style's name, truncated. The centred card is drawn at scale 4, animated, lifted and slightly enlarged, with the accent background. The others are dimmed. The carousel content has enough top padding that the lifted card is never clipped. There is no separate preview.
- Skin tone is a carousel of four cards. Optional layers start with a "none" card.
- Swatches: a `radiogroup` of round buttons below the carousel, coloured from `assets/avatar/palettes.json` (hair colours for hair, fabric colours otherwise), with translated colour names. They are hidden for skin tone, "none" and single-colour styles. Choosing a style keeps the current colour when the style has it (the existing rule).
- Animations last at most about 200 ms and are off under `prefers-reduced-motion`. The centred card's idle animation already follows that setting.

### Wardrobe panel (`apps/web`)

- Placement is unchanged: beside the rail on desktop, the compact sheet on mobile (ADR-0014, ADR-0018). On desktop it is capped at `max-w-[34rem]`, with a height that fits its content up to the current bottom limit, and it scrolls beyond that. Cancel and Apply sit at its end.
- Header: the "Wardrobe" title with the X button, then a labelled Nickname field (`NICKNAME_MAX_LENGTH`, `aria-invalid` and an error line when `parseNickname` rejects it).
- Footer: Cancel and Apply. Apply is disabled while the Nickname is invalid. Cancel, the X, Esc and C close and discard the whole draft (avatar and Nickname). C still opens the Wardrobe and is ignored in text fields, so typing a C in the Nickname field never closes it.
- Apply publishes only what changed: the avatar through the existing `useWearAvatar`, and the Nickname through the new rename path.

### Nickname change (`protocol`, `apps/server`, `apps/web`)

- `protocol` gains a nickname-change message under its `room` folder, validated with the existing Nickname schema. It also gains a `player-renamed` Announcement with `{ from, to }`.
- The room reads a Player's Nickname from `PlayerState.nickname` instead of the join options everywhere (chat, commands, radio submissions, farewell).
- The room handles the message per Player behind a token bucket of one change every 10 s, separate from the avatar's. It ignores invalid, unchanged and refused changes silently. An accepted change sets `PlayerState.nickname` and announces `player-renamed`.
- Chat messages and radio entries keep the Nickname they were created with. No history is rewritten.
- `apps/web` sends renames through a sender shaped like the avatar sender: it holds the latest Nickname and sends it as soon as the 10 s interval allows, so local settings and the room never drift apart. Apply also stores the Nickname in local settings.
- en and pt-BR gain the Wardrobe strings (Nickname label, invalid message, Cancel) and the `player-renamed` Announcement ("{from} is now {to}." / "{from} agora é {to}.").
- No slash command for renaming.

## Testing Decisions

- `protocol`: the nickname-change payload accepts a valid Nickname (trimmed) and rejects empty, too long and non-string payloads.
- Server integration tests with `@colyseus/testing`: a rename updates the state and announces `player-renamed`; a second rename within 10 s is ignored; invalid and unchanged names are ignored; chat after a rename carries the new Nickname; earlier messages are untouched.
- `apps/web` unit tests: the rename sender's coalescing, in the style of `avatar-sender.test.ts`.
- Playwright: update `avatar.spec.ts` and `wardrobe-settings.mobile.spec.ts` to the carousel (pick a layer by icon, centre a card by tapping and by arrows, pick a swatch, Apply vs Cancel). Add a two-Player test where one renames and the other sees the new name in the player list and the Announcement in the chat.

## Out of Scope

- A rename slash command (`/nick`, `/apelido`).
- Rewriting chat or queue history after a rename.
- Garment-only artwork (clothes on hangers): cards show the whole avatar.
- A bottom-drawer Wardrobe: the prototype rejected it.
- Nickname uniqueness: Nicknames stay non-unique (GLOSSARY).
