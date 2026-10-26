---
status: accepted
---

# Cars pass through Players

Cars do not collide with Players on foot and may drive across any walkable part of the Lobby, including the plaza and sidewalks. They remain subject to map obstacles and Car-to-Car collision. This preserves the social space: driving cannot trap or push people, and a Player never has to leave an area because a Car is passing through it.

## Consequences

- The marked Autodrome circuit is a landmark and effects surface, not a movement boundary.
- The server's Car collision model checks map geometry and other Cars, but excludes Players.
- The renderer must keep Car and Avatar depth ordering readable even while their sprites overlap.
