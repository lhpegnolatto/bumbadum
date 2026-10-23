import type { Avatar } from "@bumbadum/avatar";
import {
  ANNOUNCEMENT,
  type Announcement,
  AVATAR_MESSAGE,
  CHAT_HISTORY,
  CHAT_INPUT,
  CHAT_MESSAGE,
  type ChatHistory,
  type ChatMessage,
  CLOCK_PING,
  CLOCK_PONG,
  type ClockPong,
  LOBBY_SLUG,
  NOTICE,
  type Notice,
  ROOM_TYPE,
  type RoomState,
  STEP_MESSAGE,
} from "@bumbadum/protocol";
import { type Direction, lobbyMap } from "@bumbadum/world";
import { matchMaker } from "@colyseus/core";
import { type Room as ClientRoom, CloseCode } from "@colyseus/sdk";
import { boot, type ColyseusTestServer } from "@colyseus/testing";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createFakeTrackCatalog } from "../radio/fake-track-catalog.ts";
import { createServer } from "../server.ts";
import { openLobby } from "./lobby-room.ts";

let colyseus: ColyseusTestServer;

beforeAll(async () => {
  colyseus = await boot(createServer({ catalog: createFakeTrackCatalog() }));
});
afterAll(async () => {
  await colyseus.shutdown();
});
beforeEach(async () => {
  await colyseus.cleanup();
  await openLobby();
});

const AVATAR: Avatar = { skinTone: 2, hair: 3, outfit: 4 };

function joinLobby(
  nickname: string,
  avatar: unknown = AVATAR,
): Promise<ClientRoom<unknown, RoomState>> {
  return colyseus.sdk.join(ROOM_TYPE, { slug: LOBBY_SLUG, nickname, avatar });
}

/** The avatar `room` sees `player` wearing. */
function avatarOf(room: ClientRoom<unknown, RoomState>, player: ClientRoom<unknown, RoomState>) {
  const avatar = room.state.players?.get(player.sessionId)?.avatar;
  return avatar && { skinTone: avatar.skinTone, hair: avatar.hair, outfit: avatar.outfit };
}

function nicknames(room: ClientRoom<unknown, RoomState>): string[] {
  return [...room.state.players.values()].map((player) => player.nickname).sort();
}

function me(room: ClientRoom<unknown, RoomState>) {
  const player = room.state.players.get(room.sessionId);
  return { x: player?.x, y: player?.y, direction: player?.direction };
}

/** Sends step intents and waits until the room has handled all of them. */
async function walk(room: ClientRoom<unknown, RoomState>, ...directions: Direction[]) {
  await expect.poll(() => room.state.players?.get(room.sessionId)).toBeDefined();
  const handled = room.state.players.get(room.sessionId)?.stepIntents ?? 0;
  for (const direction of directions) room.send(STEP_MESSAGE, direction);
  await expect
    .poll(() => room.state.players.get(room.sessionId)?.stepIntents)
    .toBe(handled + directions.length);
}

async function rejectionOf(join: Promise<unknown>): Promise<string> {
  try {
    await join;
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error("expected the join to be rejected");
}

describe("lobby-room", () => {
  it("puts a joining player on the spawn point, facing down, with their trimmed nickname", async () => {
    const room = await joinLobby("  Ana  ");
    await room.waitForNextPatch();

    expect(room.state.players.get(room.sessionId)?.nickname).toBe("Ana");
    expect(me(room)).toEqual({ ...lobbyMap.spawnPoint, direction: "down" });
  });

  it("lets every player in the lobby see the others", async () => {
    const ana = await joinLobby("Ana");
    const bia = await joinLobby("Bia");

    await expect.poll(() => nicknames(ana)).toEqual(["Ana", "Bia"]);
    await expect.poll(() => nicknames(bia)).toEqual(["Ana", "Bia"]);
  });

  it("removes a player who leaves", async () => {
    const ana = await joinLobby("Ana");
    const bia = await joinLobby("Bia");
    await expect.poll(() => nicknames(ana)).toEqual(["Ana", "Bia"]);
    await bia.leave();

    await expect.poll(() => nicknames(ana)).toEqual(["Ana"]);
  });

  it("puts a player who reconnects after a drop back on the spawn point", async () => {
    const room = await joinLobby("Ana");
    room.reconnection.minUptime = 0;
    await room.waitForNextPatch();
    // Moved on the server directly, so the test does not depend on the map layout.
    const seat = colyseus.getRoomById<RoomState>(room.roomId).state.players.get(room.sessionId);
    if (!seat) throw new Error("expected Ana's seat");
    seat.x = lobbyMap.spawnPoint.x + 3;
    await expect
      .poll(() => room.state.players.get(room.sessionId)?.x)
      .toBe(lobbyMap.spawnPoint.x + 3);

    const reconnected = new Promise<void>((resolve) => room.onReconnect(resolve));
    room.connection.close(CloseCode.MAY_TRY_RECONNECT);
    await reconnected;

    await expect
      .poll(() => {
        const me = room.state.players.get(room.sessionId);
        return { x: me?.x, y: me?.y, direction: me?.direction };
      })
      .toEqual({ ...lobbyMap.spawnPoint, direction: "down" });
    expect(nicknames(room)).toEqual(["Ana"]);
  });

  it("rejects an invalid nickname with a code", async () => {
    expect(await rejectionOf(joinLobby("   "))).toBe("invalid-nickname");
    expect(await rejectionOf(joinLobby("a".repeat(17)))).toBe("invalid-nickname");
  });

  it("rejects an invalid avatar with a code", async () => {
    expect(
      await rejectionOf(colyseus.sdk.join(ROOM_TYPE, { slug: LOBBY_SLUG, nickname: "Ana" })),
    ).toBe("invalid-avatar");
    expect(await rejectionOf(joinLobby("Ana", { skinTone: 1, hair: 1 }))).toBe("invalid-avatar");
    expect(await rejectionOf(joinLobby("Ana", { ...AVATAR, hair: 9 }))).toBe("invalid-avatar");
  });

  it("rejects the player after the 16th with room-full, without opening a second lobby", async () => {
    for (let i = 0; i < 16; i++) {
      await joinLobby(`p${i}`);
    }

    expect(await rejectionOf(joinLobby("late"))).toBe("room-full");
    const lobbies = await matchMaker.query({ name: ROOM_TYPE });
    expect(lobbies).toHaveLength(1);
    expect(lobbies[0]?.clients).toBe(16);
  });

  describe("steps", () => {
    const spawn = lobbyMap.spawnPoint;

    it("moves the player one tile in the intent's direction, for everyone to see", async () => {
      const ana = await joinLobby("Ana");
      const bia = await joinLobby("Bia");
      await walk(ana, "left");

      expect(me(ana)).toEqual({ x: spawn.x - 1, y: spawn.y, direction: "left" });
      await expect.poll(() => bia.state.players.get(ana.sessionId)?.x).toBe(spawn.x - 1);
    });

    it("only turns the player towards a blocked tile", async () => {
      // The lobby has furniture two tiles above the spawn point and the tile left of that.
      const ana = await joinLobby("Ana");
      await walk(ana, "up", "left", "up");

      expect(me(ana)).toEqual({ x: spawn.x - 1, y: spawn.y - 1, direction: "up" });
    });

    it("lets players stand on the same tile", async () => {
      const ana = await joinLobby("Ana");
      const bia = await joinLobby("Bia");
      await walk(ana, "down");
      await walk(bia, "down");

      expect(me(bia)).toEqual(me(ana));
    });

    it("ignores a message that is not a direction", async () => {
      const ana = await joinLobby("Ana");
      ana.send(STEP_MESSAGE, { x: 1, y: 1 });
      ana.send(STEP_MESSAGE, "north");
      await walk(ana, "down");

      expect(me(ana)).toEqual({ x: spawn.x, y: spawn.y + 1, direction: "down" });
    });

    it("refuses steps beyond the step rate, still counting them as handled", async () => {
      // Nine walkable tiles lie left of the spawn point; a burst gets one second of steps.
      const ana = await joinLobby("Ana");
      await walk(ana, ...Array<Direction>(12).fill("left"));

      expect(me(ana)).toEqual({ x: spawn.x - 6, y: spawn.y, direction: "left" });
    });
  });
});

/** Everything `room` receives of one message type, in arrival order. */
function received<T>(room: ClientRoom<unknown, RoomState>, type: string): T[] {
  const messages: T[] = [];
  room.onMessage<T>(type, (message) => messages.push(message));
  return messages;
}

function say(room: ClientRoom<unknown, RoomState>, text: unknown) {
  room.send(CHAT_INPUT, { text });
}

describe("lobby-room chat", () => {
  it("sends a player's message to everyone, with who sent it", async () => {
    const ana = await joinLobby("Ana");
    const bia = await joinLobby("Bia");
    const toAna = received<ChatMessage>(ana, CHAT_MESSAGE);
    const toBia = received<ChatMessage>(bia, CHAT_MESSAGE);

    say(ana, "  hi there ");

    const expected = { senderId: ana.sessionId, nickname: "Ana", text: "hi there" };
    await expect.poll(() => toAna).toEqual([expected]);
    await expect.poll(() => toBia).toEqual([expected]);
  });

  it("gives a joining player the messages sent before they arrived", async () => {
    const ana = await joinLobby("Ana");
    const toAna = received<ChatMessage>(ana, CHAT_MESSAGE);
    say(ana, "first");
    say(ana, "second");
    await expect.poll(() => toAna).toHaveLength(2);

    const bia = await joinLobby("Bia");
    const history = received<ChatHistory>(bia, CHAT_HISTORY);

    await expect
      .poll(() => history)
      .toEqual([
        [
          { senderId: ana.sessionId, nickname: "Ana", text: "first" },
          { senderId: ana.sessionId, nickname: "Ana", text: "second" },
        ],
      ]);
  });

  it("announces to everyone a player joining and leaving, as codes", async () => {
    const ana = await joinLobby("Ana");
    const toAna = received<Announcement>(ana, ANNOUNCEMENT);

    const bia = await joinLobby("Bia");
    await bia.leave();

    await expect
      .poll(() => toAna)
      .toEqual([
        { code: "player-joined", params: { nickname: "Ana" } },
        { code: "player-joined", params: { nickname: "Bia" } },
        { code: "player-left", params: { nickname: "Bia" } },
      ]);
  });

  it("answers an unknown command with a notice to the sender only", async () => {
    const ana = await joinLobby("Ana");
    const bia = await joinLobby("Bia");
    const noticesToAna = received<Notice>(ana, NOTICE);
    const noticesToBia = received<Notice>(bia, NOTICE);
    const toBia = received<ChatMessage>(bia, CHAT_MESSAGE);

    say(ana, "/fly high");
    say(ana, "after");

    await expect.poll(() => toBia.map((message) => message.text)).toEqual(["after"]);
    expect(noticesToAna).toEqual([{ code: "unknown-command", params: { name: "fly" } }]);
    expect(noticesToBia).toEqual([]);
  });

  it("ignores blank input", async () => {
    const ana = await joinLobby("Ana");
    const toAna = received<ChatMessage>(ana, CHAT_MESSAGE);

    say(ana, "   ");
    say(ana, "after");

    await expect.poll(() => toAna.map((message) => message.text)).toEqual(["after"]);
  });

  it("refuses a sixth input within 5 seconds with a notice, and keeps it from the room", async () => {
    const ana = await joinLobby("Ana");
    const bia = await joinLobby("Bia");
    const noticesToAna = received<Notice>(ana, NOTICE);
    const toBia = received<ChatMessage>(bia, CHAT_MESSAGE);

    for (let i = 1; i <= 6; i++) say(ana, `message ${i}`);

    await expect.poll(() => noticesToAna).toEqual([{ code: "rate-limited" }]);
    await expect.poll(() => toBia).toHaveLength(5);
    expect(toBia.at(-1)?.text).toBe("message 5");
  });

  it("never passes on input that breaks the message schema", async () => {
    const ana = await joinLobby("Ana");
    const bia = await joinLobby("Bia");
    const toBia = received<ChatMessage>(bia, CHAT_MESSAGE);

    say(ana, "a".repeat(201));
    say(ana, 42);
    say(bia, "after");

    await expect.poll(() => toBia.map((message) => message.text)).toEqual(["after"]);
  });
});

describe("lobby-room avatars", () => {
  const changed: Avatar = { skinTone: 6, hair: 8, outfit: 1 };

  it("shows everyone the avatar a player joins with", async () => {
    const ana = await joinLobby("Ana", { skinTone: 5, hair: 7, outfit: 6 });
    const bia = await joinLobby("Bia");

    await expect.poll(() => avatarOf(bia, ana)).toEqual({ skinTone: 5, hair: 7, outfit: 6 });
    await expect.poll(() => avatarOf(ana, bia)).toEqual(AVATAR);
  });

  it("applies an avatar change for everyone to see", async () => {
    const ana = await joinLobby("Ana");
    const bia = await joinLobby("Bia");
    await expect.poll(() => avatarOf(bia, ana)).toEqual(AVATAR);
    ana.send(AVATAR_MESSAGE, changed);

    await expect.poll(() => avatarOf(bia, ana)).toEqual(changed);
    await expect.poll(() => avatarOf(ana, ana)).toEqual(changed);
  });

  it("ignores an invalid avatar change", async () => {
    const ana = await joinLobby("Ana");
    ana.send(AVATAR_MESSAGE, { skinTone: 6, hair: 8 });
    ana.send(AVATAR_MESSAGE, { ...changed, outfit: 7 });
    ana.send(AVATAR_MESSAGE, "outfit-2");
    // Messages are handled in order, so once the step is, so are the changes.
    await walk(ana, "down");

    expect(avatarOf(ana, ana)).toEqual(AVATAR);
  });

  it("accepts at most one avatar change every 2 seconds per player", async () => {
    const ana = await joinLobby("Ana");
    const bia = await joinLobby("Bia");
    ana.send(AVATAR_MESSAGE, changed);
    ana.send(AVATAR_MESSAGE, { skinTone: 1, hair: 1, outfit: 1 });
    bia.send(AVATAR_MESSAGE, changed);
    await walk(ana, "down");
    await walk(bia, "down");

    expect(avatarOf(ana, ana)).toEqual(changed);
    expect(avatarOf(bia, bia)).toEqual(changed);
  });
});

/** What `room` shows on air: the video and who submitted it. */
function onAir(room: ClientRoom<unknown, RoomState>) {
  const nowPlaying = room.state.radio?.nowPlaying;
  return (
    nowPlaying && { videoId: nowPlaying.track.videoId, by: nowPlaying.track.submitterNickname }
  );
}

function waiting(room: ClientRoom<unknown, RoomState>): string[] {
  return [...(room.state.radio?.queue ?? [])].map((track) => track.videoId);
}

/** Ana and Bia in the lobby, collecting what reaches them. */
async function anaAndBia() {
  const ana = await joinLobby("Ana");
  const bia = await joinLobby("Bia");
  return {
    ana,
    bia,
    noticesToAna: received<Notice>(ana, NOTICE),
    noticesToBia: received<Notice>(bia, NOTICE),
    toBia: received<Announcement>(bia, ANNOUNCEMENT),
  };
}

describe("lobby-room radio", () => {
  it("puts a track sent with /play on air for everyone, by its submitter, starting now", async () => {
    const { ana, bia } = await anaAndBia();
    const before = Date.now();

    say(ana, "/play https://www.youtube.com/watch?v=song0000001&list=PL123");

    await expect.poll(() => onAir(bia)).toEqual({ videoId: "song0000001", by: "Ana" });
    expect(onAir(ana)).toEqual({ videoId: "song0000001", by: "Ana" });
    const nowPlaying = bia.state.radio.nowPlaying;
    expect(nowPlaying?.track).toMatchObject({
      title: "Fake track song0000001",
      durationMs: 180_000,
      submitterId: ana.sessionId,
    });
    expect(nowPlaying?.startedAt).toBeGreaterThanOrEqual(before);
    expect(nowPlaying?.startedAt).toBeLessThanOrEqual(Date.now());
  });

  it("queues tracks behind the one on air, with /play or /tocar", async () => {
    const { ana, bia } = await anaAndBia();

    say(ana, "/play song0000001");
    await expect.poll(() => onAir(bia)?.videoId).toBe("song0000001");
    say(bia, "/tocar song0000002");
    await expect.poll(() => waiting(bia)).toEqual(["song0000002"]);
    say(ana, "/play song0000003");

    await expect.poll(() => waiting(ana)).toEqual(["song0000002", "song0000003"]);
    expect(bia.state.radio.queue[0]?.submitterNickname).toBe("Bia");
  });

  it("announces to everyone a track queued and a track going on air", async () => {
    const { ana, bia, toBia } = await anaAndBia();
    const radioAnnouncements = () => toBia.filter((a) => !a.code.startsWith("player-"));

    say(ana, "/play song0000001");
    await expect.poll(() => onAir(bia)).toBeDefined();
    say(bia, "/play song0000002");

    const title = (id: string) => `Fake track ${id}`;
    await expect.poll(radioAnnouncements).toEqual([
      { code: "track-queued", params: { title: title("song0000001"), nickname: "Ana" } },
      { code: "now-playing", params: { title: title("song0000001"), nickname: "Ana" } },
      { code: "track-queued", params: { title: title("song0000002"), nickname: "Bia" } },
    ]);
  });

  it("advances by the clock when a track ends, also with the room empty", async () => {
    const ana = await joinLobby("Ana");
    say(ana, "/play tiny0000001");
    say(ana, "/play tiny0000002");
    await expect.poll(() => waiting(ana)).toEqual(["tiny0000002"]);
    const firstStart = ana.state.radio.nowPlaying?.startedAt ?? 0;
    const server = colyseus.getRoomById<RoomState>(ana.roomId).state.radio;
    await ana.leave();

    await expect.poll(() => server.nowPlaying?.track.videoId).toBe("tiny0000002");
    // The next track starts the moment the previous one ends, by the clock.
    expect(server.nowPlaying?.startedAt).toBe(firstStart + 500);
    expect(server.queue).toHaveLength(0);
    await expect.poll(() => server.nowPlaying).toBeUndefined();
  });

  it("gives a joining player what is on air and when it started", async () => {
    const ana = await joinLobby("Ana");
    say(ana, "/play song0000001");
    await expect.poll(() => onAir(ana)).toBeDefined();

    const bia = await joinLobby("Bia");

    await expect.poll(() => onAir(bia)).toEqual({ videoId: "song0000001", by: "Ana" });
    expect(bia.state.radio.nowPlaying?.startedAt).toBe(ana.state.radio.nowPlaying?.startedAt);
  });

  it.each([
    ["/play live0000001", "track-live"],
    ["/play lock0000001", "track-not-embeddable"],
    ["/play long0000001", "track-too-long"],
    ["/play gone0000001", "track-not-found"],
    ["/play down0000001", "track-lookup-unavailable"],
    ["/play", "play-missing-track"],
    ["/play https://www.youtube.com/playlist?list=PL123", "play-not-a-video"],
    ["/play never gonna give you up", "play-search-unavailable"],
  ])("refuses %s with a %s notice to the sender only", async (command, code) => {
    const { ana, bia, noticesToAna, noticesToBia } = await anaAndBia();

    say(ana, command);

    await expect.poll(() => noticesToAna).toEqual([{ code }]);
    expect(onAir(bia)).toBeUndefined();
    expect(noticesToBia).toEqual([]);
  });

  it("refuses a track on air or already queued, and a fourth waiting track from one player", async () => {
    const { ana, bia, noticesToAna, noticesToBia } = await anaAndBia();
    for (const id of ["song0000001", "song0000002", "song0000003", "song0000004"]) {
      say(ana, `/play ${id}`);
    }
    await expect.poll(() => waiting(ana)).toHaveLength(3);

    say(bia, "/play song0000001");
    say(bia, "/play song0000003");
    say(ana, "/play song0000005");

    await expect
      .poll(() => noticesToBia)
      .toEqual([{ code: "track-on-air" }, { code: "track-already-queued" }]);
    await expect.poll(() => noticesToAna).toEqual([{ code: "track-too-many-waiting" }]);
    expect(waiting(bia)).toEqual(["song0000002", "song0000003", "song0000004"]);
  });

  it("answers a clock ping with its send time and the server time", async () => {
    const ana = await joinLobby("Ana");
    const pongs = received<ClockPong>(ana, CLOCK_PONG);
    const before = Date.now();

    ana.send(CLOCK_PING, { sentAt: 42.5 });

    await expect.poll(() => pongs).toHaveLength(1);
    expect(pongs[0]?.sentAt).toBe(42.5);
    expect(pongs[0]?.serverTime).toBeGreaterThanOrEqual(before);
    expect(pongs[0]?.serverTime).toBeLessThanOrEqual(Date.now());
  });

  it("answers at most a few bursts of pings at once", async () => {
    const ana = await joinLobby("Ana");
    const pongs = received<ClockPong>(ana, CLOCK_PONG);

    for (let i = 0; i < 40; i++) ana.send(CLOCK_PING, { sentAt: i });
    ana.send(CHAT_INPUT, { text: "after" });

    const toAna = received<ChatMessage>(ana, CHAT_MESSAGE);
    await expect.poll(() => toAna).toHaveLength(1);
    expect(pongs).toHaveLength(16);
  });
});
