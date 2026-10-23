---
status: accepted
---

# Colyseus as a separate, authoritative realtime server

Next.js on Vercel cannot hold long-lived WebSockets, and the game needs rooms with shared, validated state (positions, chat, radio). We run a self-hosted Colyseus server in `apps/server`, separate from the Next.js app. It is authoritative: clients send intents and the server decides the state every client sees.

## Considered options

- Hand-rolled Socket.IO / `ws`: reimplements rooms, state sync and reconnection that Colyseus already provides.
- Managed realtime (PartyKit / Durable Objects, Liveblocks, Supabase Realtime): an authoritative room with game rules fits less naturally and ties the core loop to a vendor.
