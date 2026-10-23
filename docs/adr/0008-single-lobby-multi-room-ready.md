---
status: accepted
---

# A single lobby now, built for many rooms

The MVP exposes one room, `lobby`, which every player joins. The Colyseus room type is still keyed by slug (`lobby-room` filtered by `slug`) and the web route is `/r/[slug]`; any slug other than `lobby` redirects to `/r/lobby`. Opening more rooms later means removing that restriction, not restructuring rooms or routes.
