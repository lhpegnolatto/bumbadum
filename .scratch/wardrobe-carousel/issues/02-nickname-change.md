# 02 — Change the Nickname from the Wardrobe

**What to build:** Let a Player change their Nickname in the room from the Wardrobe, seen by everyone and announced in the chat. See the spec's "Nickname change" section and the Nickname field in "Wardrobe panel".

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `protocol` has the nickname-change message (Nickname schema) and the `player-renamed` Announcement `{ from, to }`.
- [ ] The room reads Nicknames from `PlayerState.nickname` everywhere, not from the join options.
- [ ] A rename is rate-limited to one every 10 s per Player, separately from avatar changes. Invalid, unchanged and refused renames are ignored silently. An accepted rename updates the state and announces `player-renamed`.
- [ ] Chat messages and queue entries keep the Nickname they were created with.
- [ ] The Wardrobe header shows the labelled Nickname field. Apply is disabled with an error line while the Nickname is invalid, and the field is part of the draft that Cancel, X, Esc and C discard.
- [ ] Apply stores the Nickname in local settings and sends it through a coalescing rename sender.
- [ ] en and pt-BR have the field strings and "{from} is now {to}." / "{from} agora é {to}.".
- [ ] `pnpm check` and `pnpm test:e2e` pass, including protocol, server integration and sender unit tests, and a two-Player Playwright rename test.
