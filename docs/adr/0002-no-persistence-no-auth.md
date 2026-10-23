---
status: accepted
---

# No database and no authentication

bumbadum is a casual space for friends, so nothing on the server survives a restart: rooms, queues, chat and positions live only in Colyseus memory. Players have no accounts; their nickname and avatar are stored in their own browser's `localStorage` and sent when joining a room. This removes a whole class of infrastructure in exchange for losing the radio queue on restart and having no identity beyond a self-chosen nickname.
