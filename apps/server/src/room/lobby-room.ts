import {
  AVATAR_MESSAGE,
  CHAT_INPUT,
  chatInputSchema,
  type JoinOptions,
  type JoinRejection,
  LOBBY_SLUG,
  PlayerState,
  parseAvatarChange,
  parseJoinOptions,
  parseStepIntent,
  ROOM_TYPE,
  RoomState,
  STEP_MESSAGE,
} from "@bumbadum/protocol";
import { lobbyMap, STEPS_PER_SECOND, step } from "@bumbadum/world";
import { type Client, ErrorCode, matchMaker, Room, ServerError, validate } from "@colyseus/core";
import { ChatChannel } from "../chat/chat-channel.ts";
import { TokenBucket } from "../rate-limit/token-bucket.ts";

const MAX_PLAYERS = 16;

/** A second's worth of steps may arrive at once, bunched up by network jitter. */
const STEP_RATE = { capacity: STEPS_PER_SECOND, perSecond: STEPS_PER_SECOND };

/** At most one avatar change every 2 seconds. */
const AVATAR_CHANGE_RATE = { capacity: 1, perSecond: 0.5 };

/** Seconds a dropped player keeps their seat while the client reconnects. */
const RECONNECTION_WINDOW = 20;

function reject(code: JoinRejection): never {
  // The rejection travels as the matchmaking error's message: a code, never display text.
  throw new ServerError(ErrorCode.APPLICATION_ERROR, code);
}

type LobbyClient = Client<{ auth: JoinOptions }>;

export class LobbyRoom extends Room<{ state: RoomState; client: LobbyClient }> {
  override maxClients = MAX_PLAYERS;
  override autoDispose = false;
  override state = new RoomState();
  readonly #chat = new ChatChannel(this);

  private readonly stepLimits = new Map<string, TokenBucket>();
  private readonly avatarChangeLimits = new Map<string, TokenBucket>();

  override messages = {
    [CHAT_INPUT]: validate(chatInputSchema, (client: LobbyClient, { text }) => {
      this.#chat.receive(client, nicknameOf(client), text, performance.now());
    }),
    [STEP_MESSAGE]: (client: LobbyClient, payload: unknown) => {
      const direction = parseStepIntent(payload);
      const player = this.state.players.get(client.sessionId);
      if (!direction || !player) return;

      // Counted even when refused, so the client knows which of its steps the room has judged.
      player.stepIntents += 1;
      if (!this.stepLimits.get(client.sessionId)?.take(performance.now())) return;
      const { tile } = step(lobbyMap, player, direction);
      player.x = tile.x;
      player.y = tile.y;
      player.direction = direction;
    },
    [AVATAR_MESSAGE]: (client: LobbyClient, payload: unknown) => {
      const avatar = parseAvatarChange(payload);
      const player = this.state.players.get(client.sessionId);
      if (!avatar || !player) return;
      if (!this.avatarChangeLimits.get(client.sessionId)?.take(performance.now())) return;
      player.avatar.assign(avatar);
    },
  };

  /** Runs during matchmaking, before a seat is reserved. */
  static override async onAuth(_token: string, options: unknown): Promise<JoinOptions> {
    const result = parseJoinOptions(options);
    if (!result.ok) reject(result.rejection);
    const joinOptions = result.options;

    const [room] = await matchMaker.query({ name: ROOM_TYPE, slug: joinOptions.slug });
    if (room?.locked) reject("room-full");

    return joinOptions;
  }

  override onJoin(client: LobbyClient) {
    const { nickname, avatar } = joinOptionsOf(client);
    const player = new PlayerState();
    player.nickname = nickname;
    player.avatar.assign(avatar);
    player.x = lobbyMap.spawnPoint.x;
    player.y = lobbyMap.spawnPoint.y;
    player.direction = "down";
    player.stepIntents = 0;
    this.state.players.set(client.sessionId, player);
    this.stepLimits.set(client.sessionId, new TokenBucket(STEP_RATE, performance.now()));
    this.avatarChangeLimits.set(
      client.sessionId,
      new TokenBucket(AVATAR_CHANGE_RATE, performance.now()),
    );
    this.#chat.welcome(client, nickname, performance.now());
  }

  override onDrop(client: LobbyClient) {
    // Rejects when the window expires or the room is shutting down; Colyseus then calls onLeave.
    this.allowReconnection(client, RECONNECTION_WINDOW).catch(() => {});
  }

  /** A reconnecting player appears on the spawn point, like a joining one. */
  override onReconnect(client: LobbyClient) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;
    player.x = lobbyMap.spawnPoint.x;
    player.y = lobbyMap.spawnPoint.y;
    player.direction = "down";
  }

  override onLeave(client: LobbyClient) {
    this.state.players.delete(client.sessionId);
    this.stepLimits.delete(client.sessionId);
    this.avatarChangeLimits.delete(client.sessionId);
    this.#chat.farewell(client, nicknameOf(client));
  }
}

function joinOptionsOf(client: LobbyClient): JoinOptions {
  // Colyseus types auth as optional, but onAuth resolves it before every join.
  return client.auth as JoinOptions;
}

function nicknameOf(client: LobbyClient): string {
  return joinOptionsOf(client).nickname;
}

/** The lobby always exists (ADR-0008), so a full lobby never spawns a second one. */
export async function openLobby() {
  await matchMaker.createRoom(ROOM_TYPE, { slug: LOBBY_SLUG });
}
