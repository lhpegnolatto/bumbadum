---
status: superseded by ADR-0028
---

# Tennis matches are authoritative shared activities

The Lobby's Tennis court hosts short, server-authoritative matches for exactly two Players. Players join a FIFO Tennis line in the Tennis hall; the first two available Players are assigned random Tennis sides and receive a short countdown before the match begins. When the current match is close to ending, the next two Players see a private “you are next” notice. The first Player to five Points wins, and both Players leave the court afterward, returning to the end of the Tennis line only if they remain enrolled.

The server owns the Tennis match lifecycle, Ball trajectory, random targets, Rally timing, Point results and the temporary lateral-only movement restriction. Clients render and interpolate the state they receive, but never decide whether a Rebound succeeded or where the Ball will go. A match begins with a three-second countdown, alternates the server after every Point, requires the Ball to bounce before its Rebound window, and resets the Rally speed progression at the start of each Point.

The initial Racket contact zone is intentionally forgiving: a Player can rebound the Ball when their horizontal position is within roughly one Tile on either side of the Ball's landing Tile. The contact rule is a replaceable domain policy so a later tuning pass can tighten it if matches are too easy. Players can explicitly leave the Tennis line, and duplicate enrollment is rejected. During a match, all Players in the Lobby can observe the court and score, while only the two participants receive lateral controls.

The Ball's first-release target is a server-chosen horizontal position inside the singles boundaries with a safety margin from the lines. The target is not allowed to become difficult merely because it is near an extreme; difficulty comes from lateral distance and the Rally's increasing speed. The next two Players are warned when a match reaches four Points for one side or otherwise enters its final decisive Rally. Queue markers advance authoritatively while clients animate the transition. A reconnecting Player keeps their queue position or match side during the short grace period; after it expires, the connected opponent wins by abandonment. The match result remains visible for a short celebration before both Players return to the line or leave it.

The initial tuning target is 96 px/s lateral movement, held left/right input, a 10% speed increase per Rebound capped at twice the point's starting speed, and one Tile of contact tolerance on either side of the landing Tile. The Ball uses the supplied trajectory shape, including a first bounce around 68% of its path. The Tennis line uses the Lobby's existing player capacity; its 46 map markers are visual capacity, not a new Lobby limit. Tennis participants lose normal movement, driving, dancing and confetti controls while playing, but keep chat and room UI. Mobile reuses the existing analogue input and restricts it to left/right.

The first implementation slice is deliberately narrow: integrate the v4 Tennis court and hall, connect two Players through the Tennis line, start a complete match, and validate one authoritative Rally end to end before finishing every animation and UI detail. The v4 map work must not bring back the centre-square chairs that were removed from the current map; that cleanup remains outside this feature's scope.

## Considered options

- Treat Tennis as a variation of the existing `step` movement: rejected because the mode needs continuous horizontal positioning, timed contact, a Ball trajectory and a temporary movement constraint without changing normal Lobby movement.
- Treat Tennis as a variation of Car driving: rejected because Cars have continuous acceleration and collision rules, while Tennis needs turn-based Rally timing, contact windows and Point ownership.
- Keep the winner on court for the next opponent: rejected for the first release because it can let one Player monopolize the court and makes waiting time less predictable.

## Consequences

- The protocol needs a Tennis activity state and validated intents for joining/leaving the Tennis line and steering during a match.
- The server needs an injected clock and random source so match rules and Ball trajectories remain deterministic in tests.
- The web and game engine need a distinct Tennis presentation layer: queue markers, countdown/next-player notices, lateral movement, Racket animation and Ball interpolation.
- The match can be tuned later by replacing the Racket contact policy without changing queue semantics or score rules.
- The queue UI must be idempotent (`join` becomes `leave` after enrollment), and queue markers move forward when a match begins or ends.
- A disconnect has a short reconnection grace period; after it expires, the connected opponent wins by abandonment.
- The court's physical scoreboard and an accessible UI overlay both expose the current score and match state.
- The first release does not move every Player's camera to the court. Players observe through the normal spatial camera when the court is in view, while score and relevant notices remain available as room UI.
