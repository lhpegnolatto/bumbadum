# Domain Docs

Single-context: one glossary and one ADR folder cover every app and package.

## Before exploring, read these

- [GLOSSARY.md](../../GLOSSARY.md)
- [docs/adr/](../adr/): the ADRs touching the area you're about to work in.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `GLOSSARY.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0004 (radio sync by server clock), but worth reopening because…_
