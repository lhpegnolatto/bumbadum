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

**Car**:
A shared rideable object in a Room that a Player may enter, drive and leave. A Car has a visual model and colour, but is not owned by a Player.
_Avoid_: vehicle, kart (unless referring specifically to the model)

**Driver**:
The Player currently occupying a Car and controlling its movement.
_Avoid_: rider, owner

**Parking space**:
A marked place in the parking area where a Car may be left when it is not being driven.
_Avoid_: spot, slot

**Autodrome**:
The marked circuit area of the Map, including its starting grid and race decorations. In the first driving release it is a free-drive landmark, not a race mode; Cars may also cross other walkable areas of the Map.
_Avoid_: track (when referring to the whole area), circuit (when referring to the whole area)

**Free drive**:
The shared activity in which Players drive Cars around the Map without a race countdown, lap ranking or finish condition.
_Avoid_: race, match

**Tennis court**:
The marked court on the left side of the Map where a Tennis match takes place. It has a top and bottom side, a net and a lateral movement range for each Tennis player.
_Avoid_: tennis track, arena

**Tennis hall**:
The building beside the Tennis court where Players join the Tennis line and wait for a match.
_Avoid_: tennis lobby, waiting room

**Tennis line**:
The ordered list of Players waiting in the Tennis hall for a Tennis match. Joining the line reserves a position and keeps the Player at its visible marker until their turn or until they leave.
_Avoid_: Queue, matchmaking queue

**Tennis match**:
A short two-player activity on the Tennis court. It ends when one side reaches five Points, after which both Players leave the court and may return to the end of the Tennis line.
_Avoid_: game, round

**Rally**:
The live exchange in a Tennis match between one successful rebound and the next. A Rally ends when the receiving Player misses the Ball.
_Avoid_: volley, turn

**Point**:
The unit of score awarded to the Player whose opponent misses the Ball. A Tennis match is won by the first Player to five Points.
_Avoid_: goal, score event

**Tennis side**:
One of the two fixed positions on the Tennis court, top or bottom, occupied by a Player during a Tennis match. Sides are assigned randomly when the match starts.
_Avoid_: lane, spawn side

**Ball**:
The shared Tennis object that travels across the Tennis court, bounces once on the receiving side and must meet the receiving Player's Racket contact zone.
_Avoid_: projectile, shot

**Racket**:
The visual equipment used by a Tennis player. Its contact point determines where the Ball must meet the Racket contact zone; the Rebound is automatic.
_Avoid_: bat, paddle

**Rebound**:
The automatic return of the Ball after a Player reaches its contact zone. A Rebound chooses a random valid horizontal target on the opponent's side and increases the Ball's speed.
_Avoid_: hit, swing

**Racket contact zone**:
The forgiving horizontal range around the Ball's landing Tile in which a Tennis player can make a Rebound. The initial rule allows about one Tile of tolerance on each side and can later be tightened if the activity is too easy.
_Avoid_: hitbox, collision box

### Time of day

**Time of day**:
The hour a Player sees the Room at, taken from their own clock. Players in different time zones see different times of day; it is not shared like the Radio.
_Avoid_: room time, server time, clock

**Day period**:
A named span of the Time of day with its own look, such as Dawn, Midday, Sunset or Night. The look changes gradually from one Day period to the next.
_Avoid_: phase, cycle, shift

**Ambient light**:
The colour cast over the whole Map at the current Time of day, from bright daylight to deep night.
_Avoid_: tint, filter, darkness

**Lamp glow**:
The light shed by the Map's lamps and other light sources, from off by day to fully on at night.
_Avoid_: lights, light overlay, emission

**Ambient animation**:
A looping decorative movement of a Map object, such as a tree swaying or a flag waving. Each Player sees it on their own; unlike a Dance, it is not shared.
_Avoid_: idle animation, object animation

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

### Non-player characters

**Ambient NPC**:
A static world character that is not a Player and exists to make the Map feel inhabited. An Ambient NPC does not occupy a Lobby place and has an original, stylised appearance even when it honours a real artist.
_Avoid_: bot, artificial player, playable character

**Tennis Coach**:
A permanent NPC associated with the Tennis hall that can take the place of a human opponent when a Player has no eligible human opponent.
_Avoid_: tennis bot, fake player, automatic opponent

**NPC interaction**:
A private short response shown to a Player who explicitly interacts with an Ambient NPC, such as a line or musical fact. It is not a Message or an Announcement.
_Avoid_: NPC chat, system message, quest

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
