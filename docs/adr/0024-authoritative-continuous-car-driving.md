---
status: accepted
---

# Cars use authoritative continuous driving

Cars in the Lobby use continuous pixel-space position and velocity, simulated authoritatively by the server and predicted/interpolated by the client. Their input is a persistent desired direction, with automatic acceleration and braking, solid no-damage collisions that allow lateral sliding, and no extension of the avatar's tile-step protocol. This preserves the existing authoritative-server boundary while giving free drive the responsive arcade feel the feature requires.

## Consequences

- A Car is a distinct shared world entity from a Player's tile-based movement.
- The protocol must carry driving intents and continuous Car state rather than treating driving as faster `step` messages.
- The client renderer must compose the Car's rear layer, the Driver's Avatar, and its front layer, with speed-dependent animation and effects.
- Race ranking, laps and damage are out of scope for the first driving release.
