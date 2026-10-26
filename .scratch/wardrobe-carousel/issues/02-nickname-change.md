# 02 — Change the Nickname from the Wardrobe

**What to build:** Let a Player change their Nickname in the room from the Wardrobe, seen by everyone and announced in the chat. See the spec's "Nickname change" section and the Nickname field in "Wardrobe panel".

**Blocked by:** 01

**Status:** ready-for-agent

- [x] `protocol` has the nickname-change message (Nickname schema) and the `player-renamed` Announcement `{ from, to }`.
- [x] The room reads Nicknames from `PlayerState.nickname` everywhere, not from the join options.
- [x] A rename is rate-limited to one every 10 s per Player, separately from avatar changes. Invalid, unchanged and refused renames are ignored silently. An accepted rename updates the state and announces `player-renamed`.
- [x] Chat messages and queue entries keep the Nickname they were created with.
- [ ] The Wardrobe header shows the labelled Nickname field. Apply is disabled with an error line while the Nickname is invalid, and the field is part of the draft that Cancel, X, Esc and C discard.
- [ ] Apply stores the Nickname in local settings and sends it through a coalescing rename sender.
- [ ] en and pt-BR have the field strings and "{from} is now {to}." / "{from} agora é {to}.".
- [ ] `pnpm check` and `pnpm test:e2e` pass, including protocol, server integration and sender unit tests, and a two-Player Playwright rename test.

## Comments

Backend half landed on branch `worktree-agent-ae7926f0a0ff1ef9c`; the Wardrobe field is still to wire once 01 lands.

- `protocol`: `NICKNAME_MESSAGE` (`"nickname"`, payload: the bare Nickname, validated with the existing `parseNickname`, whose tests already cover trim, length, blank, control characters and non-strings) and the `player-renamed` Announcement `{ from, to }`.
- Server: the room reads Nicknames from `PlayerState.nickname` (chat, `/play`, `/skip`, farewell). Renames have their own token bucket (one per 10 s). Invalid and unchanged names neither spend it nor announce. Integration tests cover the rename and Announcement, invalid/unchanged, the rate, chat after a rename, history and the farewell.
- Web: `useChangeNickname(room)` in `apps/web/src/features/room/use-change-nickname.ts` returns `(nickname: string) => void`. It expects a Nickname `parseNickname` accepted, stores it in local settings and sends it through `createNicknameSender` (coalescing, interval 10 250 ms, unit-tested). en/pt-BR have the `player-renamed` Announcement.
- Found on the way: `useRoom` rejoined the room whenever the stored Nickname changed, and the player list and the game's labels kept the join-time Nickname. `useRoom` now reads the Nickname at join time from a ref, the player list follows `nickname` changes, and the engine redraws a renamed label.
- Still to do here: the labelled field in the Wardrobe header (Apply disabled while invalid, part of the discarded draft), its en/pt-BR strings, calling `useChangeNickname` on Apply, and the two-Player Playwright rename test.
