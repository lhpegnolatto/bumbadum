---
status: proposed
---

# Choreograph dances from existing frames, in unison by server clock

A dance is data: a named, looping sequence of existing idle and walk frames, each with a direction, a pixel offset and whether it is mirrored. No layer has dance artwork, so every current and future wearable dances without new assets. The server stores each player's dance as an ID or nothing, and every client derives the current dance frame from the estimated server clock (as the radio does, ADR-0004), so everyone performing the same dance moves in unison. A hand-drawn dance remains possible later as a third animation cycle that a choreography can reference.

## Considered options

- Hand-drawn dance sheets for the body and every style: more expressive (raised arms, new poses), but multiplies the art for every current and future wearable.
- Hand-drawn body frames over choreographed wearables: cheaper, but sleeves and hair drift out of alignment with the body.
- A per-player dance phase: simpler, but loses the shared dance-floor feel the room is for.
