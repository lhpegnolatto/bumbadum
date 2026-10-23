# bumbadum

> A cozy place where friends walk around, chat, and listen to music together.

bumbadum is a small multiplayer room inspired by Gather. Players choose a nickname and avatar, walk through a shared top-down world, and control a synchronized YouTube radio through chat commands. Everyone in the room hears the same track at the same moment.

The interface is available in English and Brazilian Portuguese.

## Features

- Real-time multiplayer movement in an authoritative Colyseus room
- A shared YouTube radio with a synchronized queue and visible screen
- `/play <YouTube URL or name>` to queue a track
- `/skip` voting, with an immediate skip when the track's submitter votes
- Room chat, announcements, command suggestions, and rate limiting
- Customizable animated avatars
- Light and dark themes saved locally
- No accounts or database: nickname, avatar, language, volume, and theme stay in the browser

## Tech stack

- **Web:** Next.js, React, Tailwind CSS, shadcn/ui, PixiJS
- **Multiplayer server:** Colyseus and WebSockets
- **Language and validation:** TypeScript and Zod
- **Tooling:** pnpm workspaces, Turborepo, Biome, Vitest, Playwright
- **Hosting:** Vercel for the web app and Render for the server

## Getting started

### Requirements

- Node.js 24 or newer
- Corepack, included with Node.js
- A YouTube Data API v3 key to use the radio with real videos

### Installation

```bash
corepack enable
pnpm install
```

Copy the example environment files:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env.local
```

Add your YouTube API key to `apps/server/.env`:

```dotenv
YOUTUBE_API_KEY=your_key_here
```

The key is used only by the server and must never be exposed to the web app. Without it, the room still works, but `/play` cannot look up or search for tracks.

Start both apps:

```bash
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000). The web app connects to the Colyseus server at `http://localhost:2567` by default.

## Commands

Type commands into the room chat:

| Command | Description |
| --- | --- |
| `/play <URL or name>` | Add a YouTube track to the queue by link or search term. |
| `/skip` | Vote to skip the track on air. |
| `/help` | Show the available commands. |

Commands also have Portuguese names (`/tocar`, `/pular`, and `/ajuda`). Either language works for every player, regardless of their interface language.

## Project structure

```text
apps/
  web/          Next.js UI, PixiJS room, chat, radio screen
  server/       Authoritative Colyseus room and YouTube adapters
packages/
  world/        Map, collision, and movement rules
  radio/        Queue, playback, skip voting, and clock sync
  chat/         Message rules and command parsing
  avatar/       Appearance model and sprite manifest
  protocol/     Shared Colyseus schemas and message types
  game-engine/  Imperative PixiJS renderer
  tooling/      Shared TypeScript configuration
```

Domain packages contain pure TypeScript rules. Dependencies flow from domain packages through the protocol and game engine into the apps; the server room composes the domains.

For the reasoning behind the architecture, see the [architecture decision records](docs/adr/). Project terminology lives in the [glossary](GLOSSARY.md), and contribution conventions are documented in [coding standards](CODING_STANDARDS.md).

## Development

Run the complete local quality gate:

```bash
pnpm check
```

This runs Biome, TypeScript, and Vitest across the workspace.

Run the cross-client Playwright suite:

```bash
pnpm test:e2e
```

End-to-end tests start both apps automatically and use fake music services, so they do not need a YouTube API key or consume API quota.

Other useful commands:

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start all apps in development mode. |
| `pnpm build` | Build the production apps. |
| `pnpm format` | Apply Biome formatting and safe fixes. |

## Deployment

The web app is designed for Vercel and needs `NEXT_PUBLIC_SERVER_URL` set to the public URL of the multiplayer server. The server includes a [Render Blueprint](render.yaml); set its secret `YOUTUBE_API_KEY` in the Render dashboard.

Before a release that changes playback or synchronization, follow the [real YouTube playback checklist](docs/checklists/real-youtube-playback.md).

## Project status

bumbadum is an early-stage project. It currently has one lobby, desktop-oriented controls, no accounts, and no persistent data. The architecture keeps room routing and the domain packages ready to grow without putting game rules in the UI or network layer.
