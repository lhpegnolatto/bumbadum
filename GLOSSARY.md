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

**Dance**:
A named, looping choreography a player performs in place, seen by everyone in the room. The current choreography alternates a `passinho` phase with a `giro` phase. Everyone performing the same dance moves in unison. A step intent ends it.
_Avoid_: emote, animation, move

**Passinho**:
The side-step phase of the Dance: a sequence of existing avatar frames that moves left and right in place.
_Avoid_: dance animation, side movement

**Giro**:
The turning phase of the Dance: a sequence of existing avatar frames that presents the avatar facing the cardinal directions and ends facing down. It is a visual choreography phase, not a change to the Player's stored Direction.
_Avoid_: rotation, turn state

**Sound-note effect**:
A visual decoration shown above a Player while their Dance is active. It has no audio and no server state of its own; clients derive its synchronized frame from the Dance clock. Reduced motion holds one static frame.
_Avoid_: sound effect, note event

**Confetti throw**:
A Player tossing confetti ahead in the Direction they face, seen by everyone in the room. It is a passing event, not part of the Player's state: whoever joins later never sees earlier throws. It ends a Dance and touches no one: a Player it lands on is unaffected.
_Avoid_: emote, projectile, shot

**Throw target**:
Where a Confetti throw lands: on the first Player ahead, short of the first blocked tile, or at the end of the throw's reach.
_Avoid_: hit, aim, destination

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

**Style**:
One look of an Appearance layer, such as a hoodie or a ponytail, whatever its colour. A player wears a Style in one of its colours.
_Avoid_: model, item, variant

**Hair**:
An optional hairstyle and hair colour an avatar wears.
_Avoid_: haircut, hairdo

**Hair colour**:
One of the fixed colours every hairstyle is offered in. All hairstyles share the same hair colours.
_Avoid_: dye, hair palette

**Fabric colour**:
One of the fixed colours every fabric wearable is offered in, from clothing to caps and bows. All fabric wearables share the same fabric colours. Wearables made of other materials, such as a gold chain or a straw hat, keep colours of their own.
_Avoid_: colourway, clothing palette

**Swatch**:
A round sample of one colour of the worn Style, which the Wardrobe offers to recolour it.
_Avoid_: colour chip, colour button

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
The editor where a player tries on Styles in private, one carousel of cards per Appearance layer whose centred card is worn, and recolours them with Swatches. In the room it also holds the player's Nickname, and only Apply publishes the draft.
_Avoid_: closet, character creator
