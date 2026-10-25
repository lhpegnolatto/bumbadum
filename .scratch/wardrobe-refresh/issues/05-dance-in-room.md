# 05 — Dance together in the room

**What to build:** Let players start and stop the chosen dance and see everyone dancing in unison, as described in the spec's Dances section (ADR-0021).

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] The avatar package holds a dance catalog with the chosen dance as data, and the sprite manifest yields its frames for any avatar.
- [ ] Player state carries `dance: <id> | null`; the server sets and clears it, rate-limits toggles and rejects unknown dances.
- [ ] `/dance` and `/dançar` start or stop the default dance; command names match regardless of accents for every command.
- [ ] `F` toggles dancing and a mobile button sits beside the wardrobe button; any step intent and opening the wardrobe end the dance.
- [ ] Every client derives the dance frame from the estimated server clock, so dancers move in unison; reduced motion shows the still pose.
- [ ] No announcement is produced; en and pt-BR strings are complete.
- [ ] ADR-0021 becomes `accepted`, and `GLOSSARY.md` gains **Dance** under World ("A named, looping choreography a player performs in place, seen by everyone in the room. Everyone performing the same dance moves in unison. A step intent ends it." _Avoid_: emote, animation, move).
- [ ] `pnpm check` and `pnpm test:e2e` (two players see each other dance and stop) pass.
