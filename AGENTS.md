# bumbadum

A cozy place where friends listen to music together. Players walk around a top-down 2D room (Gather-style) rendered with PixiJS, and chat. Chat commands like `/play <url|name>` drive a shared **radio**: every player in the room hears the same YouTube track at the same moment.

Status: **pre-scaffold**. The layout below is the target; create the monorepo to match it. Once scaffolded, delete this line.

## Stack

TypeScript end to end, pnpm workspaces + Turborepo. Next.js (App Router) + Tailwind + shadcn/ui on Vercel. Colyseus (self-hosted, authoritative) on Render. PixiJS for the game. Biome, Vitest, Playwright. No database, no auth: players pick a nickname and avatar stored in `localStorage`. Use the latest stable version of each, confirmed through Context7 docs at install time.

## Layout

```
apps/
  web/          Next.js shell: home (nickname + avatar editor), /r/[slug], chat UI, screen overlay
  server/       Colyseus: lobby-room, YouTube adapter, rate limiting
packages/
  world/        pure domain: map, tiles, collision, movement
  radio/        pure domain: queue, now playing, skip vote, clock sync math, MusicSearch port
  chat/         pure domain: message rules, generic command parsing
  avatar/       pure domain: appearance model, validation, sprite manifest
  protocol/     Colyseus state schemas + message types, one folder per domain
  game-engine/  imperative PixiJS renderer with a small API the React app mounts
  tooling/      shared tsconfig
```

Dependencies point one way: **domain packages ← protocol ← game-engine ← apps**. A domain package imports no other domain package; the server room is the composition root that wires chat commands to radio and world. Apps mirror the domains internally (`apps/server/src/radio/`, `apps/web/src/features/radio/`).

## Done

A change is done when:

1. `pnpm check` (Biome + typecheck + Vitest, all packages) is green.
2. `pnpm test:e2e` is green, when the change crosses client ↔ server.
3. The docs below still tell the truth about the code.
4. It is committed on `main` as a Conventional Commit.

## Docs

- [CODING_STANDARDS.md](CODING_STANDARDS.md): how code is written here. Read before writing code.
- [GLOSSARY.md](GLOSSARY.md): the ubiquitous language. Name things with these terms.
- [docs/adr/](docs/adr/): decisions that are hard to reverse. Read the ADRs touching the area you work in.

Keep them true. A change that alters an ADR's decision adds a new ADR and sets the old one's status to `superseded by ADR-NNNN`; a change that breaks a rule in `CODING_STANDARDS.md` updates that file in the same commit.

## Skills

Reach for the owner skill when its situation arises. Details, neighbours and the two feature workflows: [docs/agents/skills.md](docs/agents/skills.md).

| Situation | Skill |
|---|---|
| Writing or changing any code | `coding-guidelines` |
| Building a feature or fixing a bug in `packages/*` or `apps/server` | `tdd` |
| Something broken, throwing, flaky or slow | `diagnosing-bugs` |
| Boundaries between packages: new package, cross-domain dependency, "where does this live?" | `modular-design-principles` |
| A module's interface: seams, depth, testability | `codebase-design` |
| A new or contested term, `GLOSSARY.md`, an ADR | `domain-modeling` |
| React component structure and API | `react-composition-patterns` |
| React/Next performance, data fetching, bundle size | `react-best-practices` |
| Server message handlers, chat input, rate limits, env and secrets | `security-best-practices` |
| A behaviour or UI whose feel is uncertain (sync, movement, avatar editor) | `prototype` |
| An uncertain external fact (YouTube policy, Render limits) | `research` |
| A library's API (Next, Colyseus, PixiJS, Tailwind, shadcn) | Context7 |
| A step only a human can perform (API keys, dashboard env vars) | `wizard` |
| Feature finished, before committing | `code-review` |
| Deploying `apps/web` | `vercel-deploy` |
| Deploying `apps/server` | `render-deploy` |
| Auditing the web app's performance, accessibility, SEO | `web-quality-audit` |
| Editing `AGENTS.md`, `CLAUDE.md`, `docs/agents/` or a skill | `writing-for-agents` |
| Planning or stress-testing a feature | `grilling` |
