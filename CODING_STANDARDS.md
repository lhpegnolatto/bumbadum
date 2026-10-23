# Coding standards

Rules Biome already enforces are not repeated here; run `pnpm check` and trust it.

## Naming

- **kebab-case** for every file, folder, package name, route segment and Colyseus room name: `skip-vote.ts`, `chat-panel.tsx`, `@bumbadum/game-engine`, `lobby-room`. Assets too: `sprites/hairs/extra-long.png`.
- Identifiers follow TypeScript convention: `camelCase` for values and functions, `PascalCase` for types, classes and React components (`chat-panel.tsx` exports `ChatPanel`).
- Name domain concepts with the terms in [GLOSSARY.md](GLOSSARY.md), in code as in prose: `Track`, `Queue`, `SkipVote`, `Player`.
- Everything is in English: code, comments, docs, commit messages.

## TypeScript

- `strict` plus `noUncheckedIndexedAccess`.
- Validate data at every trust boundary (client messages on the server, `localStorage` reads, YouTube API responses) with a schema, then work with the parsed type inside.

## Packages

- Domain packages (`world`, `radio`, `chat`, `avatar`) are pure: plain TypeScript with no I/O, no timers, no `Date.now()`, no Colyseus, PixiJS or React. Time, randomness and external services come in as arguments or through a port (e.g. `MusicSearch`), so every rule is testable with plain values.
- A domain package imports no other domain package. The composition root (the server room, the web feature) wires domains together.
- Each package exposes one public entry (`src/index.ts`); consumers import only from it. Internal packages export TypeScript source directly (`"exports": { ".": "./src/index.ts" }`), with no build step: Next consumes them via `transpilePackages`, the server is bundled for production.
- `protocol` mirrors domain state into Colyseus schemas and defines message types together with the schemas that validate them (shape and size limits, such as a nickname's 1–16 characters); it holds no game rules of its own. Colyseus schemas use `schema()` with `t.*` fields, not `@type()` decorators.
- `game-engine` owns the PixiJS lifecycle. React mounts it (`mount`, `applyState`, events) and renders only UI around it: chat, menus, the screen column.

## Server

- The server is authoritative. Clients send intents (`move`, `chat`); the room validates them and updates state. Never trust a client-sent position, timestamp or track.
- Every client message is schema-validated and rate-limited per player before it reaches a domain.
- Secrets (the YouTube API key) live only in `apps/server` env vars.

## Web

- Tailwind + shadcn/ui for all UI. Components live under `apps/web/src/features/<feature>/`, named after the domain where one fits (`room`, `radio`; `home` for the home page). App-wide plumbing lives in `src/i18n/` and `src/lib/`; generated shadcn/ui primitives stay in `src/components/ui/`.
- Every UI string comes from `apps/web/src/i18n/messages/en.json` and `pt-BR.json`, which a test keeps key-for-key identical.
- The YouTube player is the room's **screen**: always visible, at least 200×200 px, and nothing renders on top of it; it lives in a column beside the canvas ([ADR-0006](docs/adr/0006-youtube-player-as-visible-screen.md), [ADR-0010](docs/adr/0010-screen-in-side-column.md)).
- `localStorage` holds only the player's nickname, avatar, language and volume settings, under a versioned key, parsed with a schema on read.

## Tests

Tests are the agent's feedback loop: each one proves a behaviour still holds after a change. Write the test that would catch a regression an agent could introduce; tests that only explain code to a human reader are not worth their maintenance.

- Co-locate tests with code: `queue.ts` + `queue.test.ts`.
- Test through the package's public interface, asserting on behaviour, not internals.
- Domain packages carry most of the coverage, built test-first with `tdd`.
- Server rooms get integration tests with `@colyseus/testing`; external services are replaced by in-memory fakes of their port (a fake `MusicSearch`), never by network calls.
- `game-engine` tests cover logic only (interpolation, sprite frame selection), not pixels.
- Playwright covers a few multi-client flows: two browsers in the lobby, one moves and the other sees it, `/play` syncs both.

## Commits

Conventional Commits, scoped by package or app: `feat(radio): add skip vote`, `fix(server): reject moves into blocked tiles`, `docs(adr): supersede 0007`. Work happens directly on `main` during the MVP.
