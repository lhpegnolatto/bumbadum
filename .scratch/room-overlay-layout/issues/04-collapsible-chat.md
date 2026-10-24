# 04 — Collapsible Chat with contextual input and unread indicator

**What to build:** Keep messaging immediately available while Chat is closed, move composition into the open Chat panel, and signal unseen Messages without interrupting play.

**Blocked by:** 03 — Exclusive navigation between Chat, Queue and Players.

**Status:** resolved

- [x] The Message input is centred near the bottom of the viewport while Chat is closed and appears in the Chat footer while open.
- [x] Enter focuses the input; submitting sends, clears and releases focus back to the world.
- [x] Escape first releases input focus and only a later Escape closes the Chat panel.
- [x] Typing never moves the Player, and clicking or walking does not close Chat.
- [x] A new Message received while Chat is closed sets an accessible visual indicator without a numeric count.
- [x] Opening Chat clears the indicator, while Chat history and avatar speech bubbles retain their existing behavior.
