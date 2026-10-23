import {
  type JoinOptions,
  type JoinRejection,
  LOBBY_SLUG,
  PlayerState,
  parseJoinOptions,
  ROOM_TYPE,
  RoomState,
} from "@bumbadum/protocol";
import { type Client, ErrorCode, matchMaker, Room, ServerError } from "@colyseus/core";

const MAX_PLAYERS = 16;

/** Fixed until the world brings a map with its own spawn point. */
export const SPAWN_POINT = { x: 10, y: 7 };

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

  /** Runs during matchmaking, before a seat is reserved. */
  static override async onAuth(_token: string, options: unknown): Promise<JoinOptions> {
    const joinOptions = parseJoinOptions(options);
    if (!joinOptions) reject("invalid-nickname");

    const [room] = await matchMaker.query({ name: ROOM_TYPE, slug: joinOptions.slug });
    if (room?.locked) reject("room-full");

    return joinOptions;
  }

  override onJoin(client: LobbyClient) {
    // Colyseus types auth as optional, but onAuth resolves it before every join.
    const { nickname } = client.auth as JoinOptions;
    const player = new PlayerState();
    player.nickname = nickname;
    player.x = SPAWN_POINT.x;
    player.y = SPAWN_POINT.y;
    this.state.players.set(client.sessionId, player);
  }

  override onDrop(client: LobbyClient) {
    // Rejects when the window expires or the room is shutting down; Colyseus then calls onLeave.
    this.allowReconnection(client, RECONNECTION_WINDOW).catch(() => {});
  }

  override onLeave(client: LobbyClient) {
    this.state.players.delete(client.sessionId);
  }
}

/** The lobby always exists (ADR-0008), so a full lobby never spawns a second one. */
export async function openLobby() {
  await matchMaker.createRoom(ROOM_TYPE, { slug: LOBBY_SLUG });
}
