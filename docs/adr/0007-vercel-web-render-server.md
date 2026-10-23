---
status: accepted
---

# Vercel for the web app, Render for the realtime server

`apps/web` deploys to Vercel; `apps/server` deploys to Render as a Node web service, which supports WebSockets. Splitting them follows ADR-0001: Vercel hosts Next.js well but cannot run the Colyseus process.

## Consequences

- On Render's free plan the server spins down after about 15 minutes without incoming HTTP requests or WebSocket messages, and takes around a minute to wake. A spin-down drops all room state (ADR-0002), so clients must reconnect automatically and tolerate a cold start.
