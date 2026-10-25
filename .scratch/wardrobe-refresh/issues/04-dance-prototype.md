# 04 — Prototype candidate dances

**What to build:** A throwaway prototype that plays three or four candidate choreographies built only from existing idle/walk frames, offsets and mirroring (bounce in place, spin through directions, mirrored side step, a combination), on several dressed avatars side by side and in unison, with an adjustable tempo.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] Each candidate is expressed as data in the shape the dance catalog will use.
- [x] The prototype also shows the still pose used under reduced motion.
- [x] The player picks one dance and a tempo; the choice is recorded for 05 and the prototype is discarded.

## Comments

Prototype published (private artifact): https://claude.ai/artifact/Vosznq5B6Y66t6hrAkStY7. Source: `/tmp/claude-1000/-home-luiz-repos-bumbadum/de08b60b-2a05-4c76-9e4b-aaab182b0a6b/scratchpad/dance-prototype/template.html`; it uses the atlases as they were before ticket 01.

Candidate shape, as the dance catalog would hold it:

```ts
interface DanceStep {
  cycle: "idle" | "walk";
  direction: Direction; // "left" already mirrors the right block
  frame: number;        // 0–3 within the direction
  dx: number;           // native pixels
  dy: number;
  mirrored: boolean;    // extra horizontal flip on top of the direction's own
}
interface Dance {
  id: string;
  stepsPerBeat: number; // steps per beat of the chosen tempo
  pose: number;         // step shown still under reduced motion
  steps: DanceStep[];
}
```

Candidates (all `stepsPerBeat: 2`, `pose` in brackets):

- `bounce` (Quique) [0]: 4 steps, facing down; walk 1 / idle 0 / walk 3 / idle 0, lifting 1px on each stomp.
- `spin` (Giro) [1]: 8 steps; idle down → walk right ↑1 → idle up → walk left ↑1, then two 2px hops facing down.
- `side-step` (Passinho) [0]: 4 steps; walk left dx −1 → idle down ↑1 → walk right dx +1 → idle down ↑1.
- `party` (Festa) [0]: 16 steps (8 beats); bounce, side step, a shimmy facing up (idle up dx ∓1, alternating `mirrored`), a quarter turn and a hop.

Awaiting the player's pick of dance and tempo (slider 60–160 BPM, default 110).

## Answer

The player picked `side-step` (Passinho): 4 steps at 2 steps per beat, walk left dx −1 → idle down ↑1 → walk right dx +1 → idle down ↑1, still pose step 0. Tempo is the prototype's default 110 BPM unless the player asks otherwise. Ticket 05 ships it as the dance catalog's only entry, in the `Dance`/`DanceStep` shape above. The prototype stays in the scratchpad and is not committed.
