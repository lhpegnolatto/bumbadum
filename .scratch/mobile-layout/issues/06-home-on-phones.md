# 06 — Home page on phones

**What to build:** The home page lets a Player choose a nickname and an avatar and join from a phone, down to 360 px wide. Remove the desktop-only notice.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] `DesktopOnlyNotice` and the `home.desktopOnly` message are removed, in en and pt-BR.
- [x] The nickname input, the avatar editor and Join fit 360 px wide with no horizontal scroll. Touch targets are at least 44 px.
- [x] A mobile e2e test covers choosing a nickname, changing the avatar and joining.
- [x] `pnpm check` and `pnpm test:e2e` are green.
