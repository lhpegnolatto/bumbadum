---
status: accepted
---

# i18n: the server speaks in codes, the client translates

bumbadum supports Brazilian Portuguese and English, and friends in the same room may use different languages. The server never produces human-readable text: notices and announcements travel as a code plus parameters, and each client renders them in its own language. Every command has a name in each supported language (`/play` and `/tocar`, `/skip` and `/pular`, `/help` and `/ajuda`), and every name works for every player regardless of the language they chose. A player's language is detected from the browser, can be changed on the home page and is stored in `localStorage`; it is not part of the URL, so a room link is the same for everyone.

## Consequences

- Protocol message types carry codes and parameters, never display strings, and adding a language touches only the web app and the command name table.
- Player messages are never translated.

## Considered options

- Server-rendered text in the joining player's language: couples the server to every language and breaks when two players in one room differ.
- Locale-prefixed routes (`/pt/r/lobby`): a shared link would force the sender's language on the receiver.
