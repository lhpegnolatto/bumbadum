import { LOBBY_SLUG, ROOM_TYPE, type RoomState } from "@bumbadum/protocol";
import { matchMaker } from "@colyseus/core";
import type { Room as ClientRoom } from "@colyseus/sdk";
import { boot, type ColyseusTestServer } from "@colyseus/testing";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createServer } from "../server.ts";
import { openLobby, SPAWN_POINT } from "./lobby-room.ts";

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

async function rejectionOf(join: Promise<unknown>): Promise<string> {
  try {
    await join;
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error("expected the join to be rejected");
}

describe("lobby-room", () => {
  it("puts a joining player on the spawn point with their trimmed nickname", async () => {
    const room = await joinLobby("  Ana  ");
    await room.waitForNextPatch();

    const me = room.state.players.get(room.sessionId);
    expect(me?.nickname).toBe("Ana");
    expect({ x: me?.x, y: me?.y }).toEqual(SPAWN_POINT);
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
});
