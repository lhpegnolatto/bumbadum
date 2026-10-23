# Walking skeleton

Status: ready-for-agent
Type: task

## What

Scaffold the monorepo to the layout in `AGENTS.md` and wire the thinnest end-to-end path: the home page takes a nickname, "Join" connects to `lobby-room`, and every player in the lobby shows up on the canvas as a dot with their nickname. Deploy `apps/web` to Vercel and `apps/server` to Render. i18n (pt-BR + English, ADR-0009) is in place from this slice: language detection, home switcher, `localStorage`, and the server speaking in codes.

See [spec](../spec.md): Platform and language, Room.

## Acceptance criteria

- [ ] `pnpm check` green across every package; `pnpm test:e2e` runs one two-browser test (both players see each other).
- [ ] Nickname 1–16 characters, trimmed, validated on the server; stored in `localStorage` under a versioned key.
- [ ] `/r/<anything other than lobby>` redirects to `/r/lobby`; the 17th player sees "room full".
- [ ] Every UI string comes from the pt-BR and English message files; the switcher changes them live.
- [ ] A touch device sees the desktop-only notice.
- [ ] Both apps deployed; the production link works for two people on different machines.
- [ ] The "Status: pre-scaffold" line is removed from `AGENTS.md`.

## Notes

Confirm the latest stable versions and the i18n library through Context7 at install time. A minimal reconnect is enough here; ticket 10 builds the full waiting experience.
