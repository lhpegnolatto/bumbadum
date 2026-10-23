import { LOBBY_SLUG, ROOM_TYPE, type RoomState, STEP_MESSAGE } from "@bumbadum/protocol";
import { type Direction, lobbyMap } from "@bumbadum/world";
import { matchMaker } from "@colyseus/core";
import type { Room as ClientRoom } from "@colyseus/sdk";
import { boot, type ColyseusTestServer } from "@colyseus/testing";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createServer } from "../server.ts";
import { openLobby } from "./lobby-room.ts";

let colyseus: ColyseusTestServer;

beforeAll(async () => {
  colyseus = await boot(createServer());
});
afterAll(async () => {
  await colyseus.shutdown();
});
beforeEach(async () => {
  await colyseus.cleanup();
  await openLobby();
});

function joinLobby(nickname: string): Promise<ClientRoom<unknown, RoomState>> {
  return colyseus.sdk.join(ROOM_TYPE, { slug: LOBBY_SLUG, nickname });
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

  it("rejects an invalid nickname with a code", async () => {
    expect(await rejectionOf(joinLobby("   "))).toBe("invalid-nickname");
    expect(await rejectionOf(joinLobby("a".repeat(17)))).toBe("invalid-nickname");
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
