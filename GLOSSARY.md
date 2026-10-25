# bumbadum

A shared space where friends walk around a room together and listen to the same music at the same time.

## Language

### Rooms and players

**Room**:
A shared space where players are present together and hear the same radio. Identified by a slug.
_Avoid_: server, channel, instance

**Lobby**:
The room every player joins. During the MVP it is the only room.
_Avoid_: main room, default room

**Player**:
A person present in a room, known by a nickname and an avatar.
_Avoid_: user, client, member

**Nickname**:
The display name a player chooses for themselves. Not unique and not an account.
_Avoid_: username, login

### World

**Map**:
The grid of tiles a room takes place on. Each tile is walkable or blocked.
_Avoid_: level, scene

**Tile**:
One cell of the map. A tile is either walkable or blocked.
_Avoid_: cell, square

**Step**:
A player's move of exactly one tile in one direction.
_Avoid_: movement, walk

**Step intent**:
A player's request to take one step in a direction. The room decides whether it becomes a step, or only turns the player.
_Avoid_: move, move message

**Spawn point**:
The tile where a player appears when joining or reconnecting to a room.
_Avoid_: entrance, start

**Direction**:
Where a player is facing: up, down, left or right.
_Avoid_: orientation, heading

### Radio

**Radio**:
A room's shared music playback: what is on air, what comes next, and when it started.
_Avoid_: player, jukebox, music

**Track**:
A single YouTube video submitted to the radio by a player, its submitter.
_Avoid_: song, music, video

**Submitter**:
The player who put a track in the queue.
_Avoid_: owner, requester, DJ

**Queue**:
The ordered tracks waiting to go on air after the current one.
_Avoid_: playlist

**Now playing**:
The track currently on air, together with the moment it started.
_Avoid_: current song

**Skip vote**:
A player's vote to end the current track early. The track is skipped once more than half of the players present have voted, or at once when its submitter votes.
_Avoid_: skip request

**Screen**:
The visible YouTube player inside the room, where the track on air is shown.
_Avoid_: TV, video player, embed

**Drift**:
How far a player's playback position has wandered from where the radio says it should be.
_Avoid_: lag, desync

### Chat

**Message**:
Text a player sends to everyone in the room.
_Avoid_: chat line, post

**Command**:
A message starting with `/` that asks the room to do something. Each command has a name in every supported language, such as `/play` or `/tocar`, and any of them works for every player.
_Avoid_: action, slash message

**Notice**:
Room text shown to a single player only, such as the reply to a refused command.
_Avoid_: error, alert, toast

**Announcement**:
A room event shown to every player in the chat history, such as a player joining, a track being queued or a new track on air.
_Avoid_: system message, log

### Avatar

**Avatar**:
A player's visual appearance, composed from a skin tone and wearable appearance layers.
_Avoid_: character, skin, sprite

**Skin tone**:
The colour of an avatar's body.
_Avoid_: skin, colour, body type

**Appearance layer**:
One independently selected part of an avatar's appearance: hair, top, bottom, footwear, overgarment, neckwear, eyewear or headwear. Skin tone is part of the avatar but is not wearable.
_Avoid_: slot, category, outfit

**Hair**:
An optional hairstyle and hair colour an avatar wears.
_Avoid_: haircut, hairdo

**Top**:
Required clothing worn on an avatar's torso.
_Avoid_: shirt, upper body

**Bottom**:
Required clothing worn on the lower half of an avatar.
_Avoid_: trousers, lower body

**Footwear**:
An optional wearable layer over an avatar's feet, such as sneakers.
_Avoid_: shoes, foot accessory

**Overgarment**:
An optional wearable layer over an avatar's top and bottom, such as overalls.
_Avoid_: outfit, full body

**Neckwear**:
An optional wearable layer around an avatar's neck, such as a chain.
_Avoid_: neck accessory

**Headwear**:
An optional wearable layer over an avatar's head, such as a cap or crown.
_Avoid_: hat, head accessory

**Eyewear**:
An optional wearable layer over an avatar's eyes, such as glasses.
_Avoid_: glasses, face accessory

**Clothing**:
Wearables that form an avatar's main outfit: a top, bottom or one-piece garment.
_Avoid_: clothes tab, outfit layer

**One-piece garment**:
A garment that visually covers an avatar's torso and lower body, such as a dress or pinafore.
_Avoid_: dress layer, full-body outfit

**Accessory**:
An optional wearable detail added around or above an avatar's clothing, such as footwear, neckwear, eyewear or headwear.
_Avoid_: decoration, extra layer

**Wardrobe**:
The editor where a player previews appearance changes and chooses which avatar to wear.
_Avoid_: closet, character creator
