# Skills

The routing table in [AGENTS.md](../../AGENTS.md) names one owner skill per situation. This file holds what the table cannot: where each skill stops, which neighbour it gets confused with, and what it means in bumbadum. Project skills live in `.claude/skills/`; the rest come from the `mattpocock-skills` plugin. The `superpowers` plugin is disabled for this project.

## Feature workflows

Pick by size. **Does the feature fit in one agent session?**

- **Yes → light flow.** `grilling` to settle the open decisions, `tdd` to build it slice by slice, `code-review` on the diff, then a Conventional Commit on `main`.
- **No → full flow**, run by the human: `/grill-with-docs` (grills and updates `GLOSSARY.md` and ADRs as it goes), `/to-spec`, `/to-tickets`, then `/implement`, which drives `tdd` and closes with `code-review`. Specs and tickets live in the local tracker set up by `/setup-matt-pocock-skills`. Example: the whole radio system.

When unsure, start light; if `grilling` surfaces more than one session's worth of work, switch to the full flow.

## Building and fixing

### `coding-guidelines`
Baseline behaviour for every code change: state assumptions, write the minimum, touch only what the task needs, define a verifiable goal. Always applies alongside whichever skill owns the task.

### `tdd`
Owns feature work and bug fixes in `packages/*` and `apps/server`: red-green-refactor, one vertical slice at a time. Domain packages are pure, so tests use plain values. Server rooms are tested with `@colyseus/testing` and a fake `MusicSearch`. In `apps/web` and `game-engine`, use it for logic (state mapping, interpolation, frame selection), not for rendering.

### `diagnosing-bugs`
Owns anything broken, throwing, flaky or slow, especially once a quick look has not found the cause. Typical bumbadum cases: drift that keeps growing, positions diverging between clients, a room that stops sending patches. Once the cause is found and a regression test is red, the fix itself follows `tdd`.

### `prototype`
For questions answered by trying rather than reasoning: how much drift is noticeable, how tile steps feel at a given speed, what the avatar editor should look like. The output is throwaway; the decision it produces gets built properly with `tdd`.

## Design

### `modular-design-principles`
Macro level: boundaries **between** packages. Use it when adding a package, when a domain seems to need another domain, when deciding where new code lives, or when `protocol` starts accumulating rules. In bumbadum terms: the four domain packages are its bounded contexts, the server room and web features are its composition roots, and `protocol` is the explicit contract.
Neighbour: `codebase-design` works inside a module; this skill works on the lines between them.

### `codebase-design`
Micro level: the shape of one module's interface, where a seam goes, how to make a module deeper or easier to test. Typical cases: the `game-engine` API React mounts, the `MusicSearch` port, the public entry of a domain package.
Neighbour: `modular-design-principles` for anything that moves a package boundary.

### `domain-modeling`
Owns changes to the domain model: a new term, two words for one concept, a term used inconsistently, recording or superseding an ADR. It writes `GLOSSARY.md` and `docs/adr/` in the formats this repo already uses. Reading the glossary for vocabulary needs no skill.

## React

### `react-composition-patterns`
Structure and API of components in `apps/web`: compound components, context providers, avoiding boolean-prop sprawl. Typical cases: the chat panel, the avatar editor, the screen overlay.
Neighbour: `react-best-practices` for performance.

### `react-best-practices`
Performance in `apps/web`: re-renders, data fetching, bundle size, Next.js server/client boundaries. The game loop is in `game-engine`, so frame-rate work belongs there, not to this skill; this skill matters most for keeping React from re-rendering on every state patch.

## Security

### `security-best-practices`
Applies proactively here, not only on request. Load it when touching Colyseus message handlers, chat input handling, rate limiting, or env vars and secrets, and before the first deploy of each app. Read its TypeScript/Next.js and React references. Every client message is untrusted input; the YouTube API key exists only on the server.

## Facts and docs

### Context7 (MCP)
Current API docs for libraries: Next.js, React, Colyseus, PixiJS, Tailwind, shadcn/ui, Biome, Vitest, Playwright, Turborepo. Use it before writing code against a library API and when choosing versions.

### `research`
For external facts that are not a library's API and could change: YouTube API quotas and policies, Render plan limits, browser autoplay rules. It writes cited findings under `docs/research/`. If a finding changes a decision, update or supersede the ADR.

## Shipping

### `code-review`
Run when a feature is finished, before committing. It reviews the diff since the last stable commit against `CODING_STANDARDS.md` (Standards axis) and against the spec or ticket when one exists (Spec axis).

### `vercel-deploy`
Deploys `apps/web`. It deploys a preview unless production is explicitly asked for. The web app needs the public URL of the Colyseus server as an env var.

### `render-deploy`
Deploys `apps/server` as a Node web service through a `render.yaml` Blueprint. Remember the free-plan spin-down and the reconnect requirement ([ADR-0007](../adr/0007-vercel-web-render-server.md)).

### `wizard`
Generates a step-by-step script for things only the human can do: creating the YouTube Data API key in Google Cloud, setting env vars in the Vercel and Render dashboards, connecting the repo to each.

### `web-quality-audit`
A broad Lighthouse-style audit (performance, accessibility, SEO, best practices) of `apps/web`. Run on request or before sharing a new version with friends. The PixiJS canvas and the YouTube embed dominate the performance numbers; judge findings against that.

## Writing and planning

### `writing-for-agents`
Owns edits to `AGENTS.md`, `CLAUDE.md`, `docs/agents/` and any skill. Keep the routing table in `AGENTS.md` and this file in sync: a new skill gets a row there and a section here.

### `grilling`
Interviews the human until a plan has no silent assumptions. The entry point of the light flow, and the way to stress-test any design before building it.

## Human-invoked

These run only when the human types them; suggest one when it fits:

- `/grill-with-docs`, `/to-spec`, `/to-tickets`, `/implement`, `/implement-spec`: the full feature flow.
- `/setup-matt-pocock-skills`: configures the local tracker and domain docs layout (single-context). Run once.
- `/handoff`: compacts a session for another agent to continue.
- `/retro`: suggests improvements to the agent environment after a session.
- `/improve-codebase-architecture`: scans for deepening opportunities once there is real code.

`pr` is not used: work goes straight to `main` during the MVP.
