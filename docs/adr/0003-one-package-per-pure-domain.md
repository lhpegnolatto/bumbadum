---
status: accepted
---

# One package per domain, pure and mutually independent

The game splits into four domains (world, radio, chat, avatar), each its own package under `packages/`. Domain packages contain no I/O or framework code and never import one another; the server room and the web features are the composition roots that wire them together (chat parses `/play x` into a command, the room hands it to radio). Package-per-domain makes the boundaries enforceable through `package.json` dependencies instead of convention, and keeps every rule testable without fakes of other domains.

## Considered options

- A single `packages/core` with one folder per domain: less setup, but boundaries hold only by discipline.
