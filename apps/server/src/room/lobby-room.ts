import { type DanceId, DEFAULT_DANCE } from "@bumbadum/avatar";
import {
  AVATAR_MESSAGE,
  avatarStateValue,
  CHAT_INPUT,
  CLOCK_PING,
  CONFETTI_THROW_MESSAGE,
  CONFETTI_THROWN,
  type ConfettiThrown,
  chatInputSchema,
  clockPingSchema,
  DANCE_MESSAGE,
  isConfettiThrowIntent,
  type JoinOptions,
  type JoinRejection,
  LOBBY_SLUG,
  NICKNAME_MESSAGE,
  NOT_DANCING,
  PlayerState,
  parseAvatarChange,
  parseDanceIntent,
  parseJoinOptions,
  parseNickname,
  parseStepIntent,
  ROOM_TYPE,
  RoomState,
  STEP_MESSAGE,
} from "@bumbadum/protocol";
import { lobbyMap, STEPS_PER_SECOND, step, throwTarget } from "@bumbadum/world";
import { type Client, matchMaker, Room, ServerError, validate } from "@colyseus/core";
import { ChatChannel } from "../chat/chat-channel.ts";
import { RadioStation, type TrackSources } from "../radio/radio-station.ts";
import { TokenBucket } from "../rate-limit/token-bucket.ts";

const MAX_PLAYERS = 16;

/** A second's worth of steps may arrive at once, bunched up by network jitter. */
const STEP_RATE = { capacity: STEPS_PER_SECOND, perSecond: STEPS_PER_SECOND };

/** At most one avatar change every 2 seconds. */
const AVATAR_CHANGE_RATE = { capacity: 1, perSecond: 0.5 };

/** At most one Nickname change every 10 seconds: each one is announced to the room. */
const NICKNAME_CHANGE_RATE = { capacity: 1, perSecond: 0.1 };

/** At most two dance changes a second: starting and stopping again. */
const DANCE_CHANGE_RATE = { capacity: 2, perSecond: 1 };

/** A burst of three Confetti throws, then one a second. */
const CONFETTI_THROW_RATE = { capacity: 3, perSecond: 1 };

/** Seconds a dropped player keeps their seat while the client reconnects. */
const RECONNECTION_WINDOW = 20;

function reject(code: JoinRejection): never {
  // The rejection travels as the matchmaking error's message: a code, never display text.
  throw new ServerError(400, code);
}

type LobbyClient = Client<{ auth: JoinOptions }>;

/** What the server hands every room it creates (see `createServer`). */
export type LobbyRoomOptions = TrackSources;

export class LobbyRoom extends Room<{ state: RoomState; client: LobbyClient }> {
  override maxClients = MAX_PLAYERS;
  override autoDispose = false;
  override state = new RoomState();
  #radio!: RadioStation;
  #chat!: ChatChannel;

  private readonly stepLimits = new Map<string, TokenBucket>();
  private readonly avatarChangeLimits = new Map<string, TokenBucket>();
  private readonly nicknameChangeLimits = new Map<string, TokenBucket>();
  private readonly danceChangeLimits = new Map<string, TokenBucket>();
  private readonly confettiThrowLimits = new Map<string, TokenBucket>();

  override messages = {
    [CHAT_INPUT]: validate(chatInputSchema, (client: LobbyClient, { text }) => {
      const player = this.state.players.get(client.sessionId);
      if (player) this.#chat.receive(client, player.nickname, text, performance.now());
    }),
    [CLOCK_PING]: validate(clockPingSchema, (client: LobbyClient, { sentAt }) => {
      this.#radio.answerPing(client, sentAt);
    }),
    [STEP_MESSAGE]: (client: LobbyClient, payload: unknown) => {
      const direction = parseStepIntent(payload);
      const player = this.state.players.get(client.sessionId);
      if (!direction || !player) return;

      // Counted even when refused, so the client knows which of its steps the room has judged.
      player.stepIntents += 1;
      // Any step intent ends a dance, even one the rate refuses or that only turns the player.
      player.dance = NOT_DANCING;
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
      player.avatar.assign(avatarStateValue(avatar));
    },
    [NICKNAME_MESSAGE]: (client: LobbyClient, payload: unknown) => {
      const nickname = parseNickname(payload);
      const player = this.state.players.get(client.sessionId);
      // An unchanged Nickname is not a change, so it neither spends the rate nor announces.
      if (!nickname || !player || nickname === player.nickname) return;
      if (!this.nicknameChangeLimits.get(client.sessionId)?.take(performance.now())) return;
      const from = player.nickname;
      player.nickname = nickname;
      this.#chat.renamed(from, nickname);
    },
    [DANCE_MESSAGE]: (client: LobbyClient, payload: unknown) => {
      const intent = parseDanceIntent(payload);
      if (intent) this.#changeDance(client, intent.dance);
    },
    [CONFETTI_THROW_MESSAGE]: (client: LobbyClient, payload: unknown) => {
      if (isConfettiThrowIntent(payload)) this.#throwConfetti(client);
    },
  };

  override onCreate({ catalog, search }: LobbyRoomOptions) {
    // The room is the composition root: chat commands reach the radio here (ADR-0003).
    this.#radio = new RadioStation(this, { catalog, search });
    this.#chat = new ChatChannel(this, {
      play: (client, nickname, args) => {
        this.#radio
          .play(client, { id: client.sessionId, nickname }, args)
          .catch((error: unknown) => {
            console.error("/play failed", error);
          });
      },
      skip: (client, nickname) => {
        this.#radio.skip(client, { id: client.sessionId, nickname });
      },
      dance: (client) => {
        const dancing = this.state.players.get(client.sessionId)?.dance;
        this.#changeDance(client, dancing ? null : DEFAULT_DANCE);
      },
      confetti: (client) => {
        this.#throwConfetti(client);
      },
    });
  }

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
    player.avatar.assign(avatarStateValue(avatar));
    player.x = lobbyMap.spawnPoint.x;
    player.y = lobbyMap.spawnPoint.y;
    player.direction = "down";
    player.stepIntents = 0;
    player.dance = NOT_DANCING;
    this.state.players.set(client.sessionId, player);
    this.stepLimits.set(client.sessionId, new TokenBucket(STEP_RATE, performance.now()));
    this.avatarChangeLimits.set(
      client.sessionId,
      new TokenBucket(AVATAR_CHANGE_RATE, performance.now()),
    );
    this.nicknameChangeLimits.set(
      client.sessionId,
      new TokenBucket(NICKNAME_CHANGE_RATE, performance.now()),
    );
    this.danceChangeLimits.set(
      client.sessionId,
      new TokenBucket(DANCE_CHANGE_RATE, performance.now()),
    );
    this.confettiThrowLimits.set(
      client.sessionId,
      new TokenBucket(CONFETTI_THROW_RATE, performance.now()),
    );
    this.#chat.welcome(client, nickname, performance.now());
    this.#radio.welcome(client);
  }

  override onDrop(client: LobbyClient) {
    this.#radio.drop(client);
    // Rejects when the window expires or the room is shutting down; Colyseus then calls onLeave.
    this.allowReconnection(client, RECONNECTION_WINDOW).catch(() => {});
  }

  /** A reconnecting player appears on the spawn point, standing still, like a joining one. */
  override onReconnect(client: LobbyClient) {
    this.#radio.reconnect(client);
    const player = this.state.players.get(client.sessionId);
    if (!player) return;
    player.x = lobbyMap.spawnPoint.x;
    player.y = lobbyMap.spawnPoint.y;
    player.direction = "down";
    player.dance = NOT_DANCING;
  }

  /** Starts `dance`, or stops dancing on `null`, within the player's dance change rate. */
  #changeDance(client: LobbyClient, dance: DanceId | null) {
    const player = this.state.players.get(client.sessionId);
    if (!player || !this.danceChangeLimits.get(client.sessionId)?.take(performance.now())) return;
    player.dance = dance ?? NOT_DANCING;
  }

  /**
   * Throws confetti from where the player stands, the way they face, within their throw rate,
   * and shows everyone where it lands. A throw ends a dance.
   */
  #throwConfetti(client: LobbyClient) {
    const player = this.state.players.get(client.sessionId);
    if (!player || !this.confettiThrowLimits.get(client.sessionId)?.take(performance.now())) return;
    player.dance = NOT_DANCING;
    const isOccupied = (tile: { x: number; y: number }) =>
      [...this.state.players].some(
        ([id, other]) => id !== client.sessionId && other.x === tile.x && other.y === tile.y,
      );
    const thrown: ConfettiThrown = {
      throwerId: client.sessionId,
      direction: player.direction,
      target: throwTarget(lobbyMap, player, player.direction, isOccupied),
    };
    this.broadcast(CONFETTI_THROWN, thrown);
  }

  override onLeave(client: LobbyClient) {
    // The Nickname they leave with, which a rename may have changed since they joined.
    const nickname =
      this.state.players.get(client.sessionId)?.nickname ?? joinOptionsOf(client).nickname;
    this.state.players.delete(client.sessionId);
    this.stepLimits.delete(client.sessionId);
    this.avatarChangeLimits.delete(client.sessionId);
    this.nicknameChangeLimits.delete(client.sessionId);
    this.danceChangeLimits.delete(client.sessionId);
    this.confettiThrowLimits.delete(client.sessionId);
    this.#chat.farewell(client, nickname);
    this.#radio.farewell(client);
  }
}

function joinOptionsOf(client: LobbyClient): JoinOptions {
  // Colyseus types auth as optional, but onAuth resolves it before every join.
  return client.auth as JoinOptions;
}

/** The lobby always exists (ADR-0008), so a full lobby never spawns a second one. */
export async function openLobby() {
  await matchMaker.createRoom(ROOM_TYPE, { slug: LOBBY_SLUG });
}
