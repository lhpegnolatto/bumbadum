---
status: accepted
---

# Use static ambient NPCs and a server-authoritative Tennis Coach

The Lobby includes a small curated set of Ambient NPCs to make the Map feel inhabited. Each Ambient NPC has a fixed position, collision, an idle animation, a visible name and a private NPC interaction. Ambient NPCs are authored as Map content rather than as dynamic Lobby entities, so they do not occupy Lobby capacity and do not add state to the room protocol. Their visual appearance is original and stylised, while names and short facts may explicitly honour real international artists.

The Tennis hall includes a permanent Tennis Coach. The Coach is the only artificial participant in Tennis: it is not a Player, does not have a session and does not consume a Lobby place. A Tennis match against the Coach uses the same authoritative match lifecycle, Ball, Rally, Point, score and ending rules as a human match. The server owns the Coach's movement and Rebound decisions through a configurable, deterministic difficulty policy; the Coach may win.

When exactly one Player is present in the Lobby, that Player starts a Tennis match against the Coach immediately after joining the Tennis line. When more than one Player is present, a Player who remains the only human in the Tennis line for 15 seconds is paired with the Coach. If another eligible Player joins before the timer expires, normal human matchmaking takes precedence. A Coach match already in progress is not interrupted when another Player joins; that Player enters the Tennis line for a later match. After the Coach match ends, the human participant leaves the Tennis line, following the existing Tennis match exit rule.

Coach matches are visible to every Player in the Lobby and use the existing Tennis presentation and observation rules. A human Player joining during a Coach match waits normally and never replaces the Coach mid-match. Leaving before the match begins cancels the waiting timer; leaving during the match is abandonment under the existing Tennis rules.

## Considered options

- Make every NPC a dynamic protocol entity: rejected because ambient characters have fixed map placement and no shared runtime behaviour; synchronising them would add state without improving the experience.
- Make the Coach a local client simulation: rejected because the server must remain authoritative for Ball trajectories, Rebounds, Points and match results.
- Interrupt a Coach match when a human opponent arrives: rejected because it would make a match outcome depend on join timing and would violate the existing match lifecycle.
- Keep a Player enrolled after a Coach match: rejected because the existing Tennis exit rule avoids unexpected automatic re-enrolment and repeated matches.

## Consequences

- Map generation and the game engine need a static NPC content path separate from dynamic Player state.
- NPC interaction content needs validation and localisation without turning the NPC into a chat participant.
- The protocol and Tennis activity need to represent a non-Player participant while preserving the existing two-sided match rules.
- The server needs an injected clock and random source for the solo-line timer and Coach policy so the behaviour remains deterministic in tests.
- The initial artist roster is deliberately small, six to eight curated NPCs, and can grow by adding Map/content data rather than changing the model.
- First-party art remains the default; any third-party likeness or asset requires a separate decision under ADR-0012.
