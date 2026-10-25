# 05 — Dance together in the room

**What to build:** Let players start and stop the chosen dance and see everyone dancing in unison, as described in the spec's Dances section (ADR-0021).

**Blocked by:** 04

**Status:** resolved

- [x] The avatar package holds a dance catalog with the chosen dance as data, and the sprite manifest yields its frames for any avatar.
- [x] Player state carries `dance: <id> | null`; the server sets and clears it, rate-limits toggles and rejects unknown dances.
- [x] `/dance` and `/dançar` start or stop the default dance; command names match regardless of accents for every command.
- [x] `F` toggles dancing and a mobile button sits beside the wardrobe button; any step intent and opening the wardrobe end the dance.
- [x] Every client derives the dance frame from the estimated server clock, so dancers move in unison; reduced motion shows the still pose.
- [x] No announcement is produced; en and pt-BR strings are complete.
- [x] ADR-0021 becomes `accepted`, and `GLOSSARY.md` gains **Dance** under World ("A named, looping choreography a player performs in place, seen by everyone in the room. Everyone performing the same dance moves in unison. A step intent ends it." _Avoid_: emote, animation, move).
- [x] `pnpm check` and `pnpm test:e2e` (two players see each other dance and stop) pass.

## Answer

The avatar package holds the dance catalog (`side-step`, 110 BPM, two steps a beat) and `danceStep`, which picks the dance frame from the server time, or the still pose under reduced motion. `PlayerState.dance` carries the dance ID or "", set by the `dance` message (unknown dances ignored) and toggled by `/dance`/`/dançar`, both within two changes a second; any step intent, a reconnect and joining clear it. Command names now match without accents for every command. The engine draws the dance frame (direction, frame, nudge, extra flip) from the one server clock the web app keeps for the radio and the dancers, and walking takes precedence. `F` and a Dance button beside the Wardrobe toggle it, and opening the Wardrobe ends it and disables the button. ADR-0021 is accepted and the glossary has Dance. `pnpm check` and `pnpm test:e2e` (52, with a new two-player dance test and the help lists updated for `/dance`) pass.
