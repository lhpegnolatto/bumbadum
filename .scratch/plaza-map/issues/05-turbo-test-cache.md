# 05 — Tests rerun when a dependency changes

**What to build:** Make `pnpm check` rerun a package's tests whenever an internal package it depends on changes. Today the root `test` task has no dependency on its dependencies' tasks, so editing `@bumbadum/world` replays cached green tests for `apps/server` and `apps/web`. That hid a failing server test during ticket 01. `@bumbadum/avatar` and its `assets/avatar` sources have the same gap.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] Changing a source file in a domain package invalidates the cached `test` (and `typecheck`) of every package that depends on it.
- [x] Changing a canonical asset (`assets/map/**`, `assets/avatar/**`) invalidates the tests that `--check` its generated output.
- [x] Verified by editing a dependency and observing a cache miss for the dependents in `turbo run typecheck test --dry=json` or a real run.
- [x] `pnpm check` stays green, and the fix does not make it noticeably slower when nothing has changed.

## Comments

Resolved with a `transit` node (`transit` depends on `^transit`; `typecheck` and `test` depend on `transit`), per Turborepo's docs, plus `packages/avatar/turbo.json` listing the avatar sources and atlases as `test` inputs. A dry run after editing `packages/world/src/step.ts` misses the cache for world, protocol, game-engine, server and web; editing `assets/avatar/retired.json` misses `@bumbadum/avatar#test`. With nothing changed, every task hits the cache.
