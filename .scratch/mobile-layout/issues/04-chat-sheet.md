# 04 — Chat sheet with Chat, Queue and Players tabs

**What to build:** In the compact layout, a Chat button at the bottom right carries the unread indicator and opens a sheet covering the area below the Radio strip. The sheet has three tabs (Chat, Queue and Players), opens on Chat, and closes with an X in its header. The Message input appears only in the Chat tab, and only while the sheet is open. It stays above the on-screen keyboard.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] With the sheet closed there is no Message input. Speech bubbles still show, and a Message from someone else sets the unread indicator, which does not rely on colour alone.
- [ ] Opening the Chat tab clears the indicator. The input is not autofocused.
- [ ] While the sheet is open, the player does not walk, and the floating controls are hidden.
- [ ] The sheet's tabs and the desktop panels are the same state. Resizing across layouts keeps the open one.
- [ ] Focusing the input keeps the Screen at the top, shrinks the history and keeps the input just above the keyboard. This uses `interactive-widget` on Chromium and `visualViewport` on iOS Safari.
- [ ] Mobile e2e tests cover opening the sheet, switching tabs, sending a Message, closing with X, and the unread indicator across two pages.
- [ ] New labels have en and pt-BR parity.
- [ ] `pnpm check` and `pnpm test:e2e` are green.
