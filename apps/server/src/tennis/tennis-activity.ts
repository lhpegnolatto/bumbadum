import {
  CONFETTI_THROWN,
  type ConfettiThrown,
  TENNIS_COACH_ID,
  TENNIS_EVENT,
  TENNIS_NOTICE,
  TennisBallState,
  TennisParticipantState,
  type TennisSide,
  type TennisState,
  type TennisSteerDirection,
} from "@bumbadum/protocol";
import {
  attemptRebound,
  type CoachDifficulty,
  createTennisLine,
  DEFAULT_TENNIS_RULES,
  FRIENDLY_COACH_DIFFICULTY,
  joinTennisLine,
  leaveTennisLine,
  type RandomSource,
  shouldCoachMiss,
  shouldPairSoloHumanWithCoach,
  startNextTennisMatch,
  type TennisMatch,
  type TennisRules,
} from "@bumbadum/tennis";
import { PLAZA_V2_TENNIS_COURT, PLAZA_V2_TENNIS_LINE } from "@bumbadum/world";
import type { Client } from "@colyseus/core";

const COUNTDOWN_MS = 3_000;
const POINT_PAUSE_MS = 2_000;
const RECONNECTION_GRACE_MS = 20_000;
const CELEBRATION_MS = 2_000;
const BOUNCE_FRACTION = 0.68;
const LATERAL_SPEED = 96;
const TENNIS_LINE_CAPACITY = PLAZA_V2_TENNIS_LINE.length;

const topSpawn = findCourtPoint("player-top");
const bottomSpawn = findCourtPoint("player-bottom");

export interface TennisActivityPlayer {
  x: number;
  y: number;
  direction: "up" | "down" | "left" | "right";
  dance: string;
  carId: string;
}

export interface TennisActivityRoom {
  readonly state: TennisState;
  playerCount(): number;
  player(sessionId: string): TennisActivityPlayer | undefined;
  client(sessionId: string): Client | undefined;
  broadcast(type: string, message: unknown): void;
}

export interface TennisActivityOptions {
  now?: () => number;
  random?: RandomSource;
  rules?: TennisRules;
  coachDifficulty?: CoachDifficulty;
}

/** The server-side owner of Tennis queue, match lifecycle, inputs and Rally timing. */
export class TennisActivity {
  readonly #room: TennisActivityRoom;
  readonly #state: TennisState;
  readonly #now: () => number;
  readonly #random: RandomSource;
  readonly #rules: TennisRules;
  readonly #coachDifficulty: CoachDifficulty;
  readonly #steering = new Map<string, TennisSteerDirection>();
  readonly #enrolled = new Set<string>();
  readonly #reconnectionDeadlines = new Map<string, number>();
  #line = createTennisLine(TENNIS_LINE_CAPACITY);
  #match: TennisMatch | null = null;
  #celebrationEndsAt = 0;
  #soloQueuedAt = 0;

  constructor(room: TennisActivityRoom, options: TennisActivityOptions = {}) {
    this.#room = room;
    this.#state = room.state;
    this.#now = options.now ?? Date.now;
    this.#random = options.random ?? { next: () => Math.random() };
    this.#rules = options.rules ?? DEFAULT_TENNIS_RULES;
    this.#coachDifficulty = options.coachDifficulty ?? FRIENDLY_COACH_DIFFICULTY;
    this.#syncQueue();
  }

  isInMatch(sessionId: string): boolean {
    return this.#match?.players.includes(sessionId) ?? false;
  }

  isQueued(sessionId: string): boolean {
    return this.#line.playerIds.includes(sessionId);
  }

  join(sessionId: string, now = this.#now()): void {
    if (this.#enrolled.has(sessionId)) return;
    const result = joinTennisLine(this.#line, sessionId);
    if (result.status === "full" || result.status === "already-joined") return;
    this.#enrolled.add(sessionId);
    this.#line = result.line;
    this.#soloQueuedAt = this.#line.playerIds.length === 1 ? now : 0;
    this.#syncQueue();
    this.#positionQueuedPlayers();
    this.#startIfReady(now);
  }

  leave(sessionId: string, now = this.#now()): void {
    if (this.isInMatch(sessionId)) {
      this.#enrolled.delete(sessionId);
      this.#reconnectionDeadlines.delete(sessionId);
      this.#steering.delete(sessionId);
      this.#resolveAbandonment(sessionId, now);
      return;
    }

    this.#line = leaveTennisLine(this.#line, sessionId);
    this.#enrolled.delete(sessionId);
    if (this.#line.playerIds.length !== 1) this.#soloQueuedAt = 0;
    this.#syncQueue();
    this.#positionQueuedPlayers();
    this.#startIfReady(now);
  }

  steer(sessionId: string, direction: TennisSteerDirection): void {
    if (!this.isInMatch(sessionId)) return;
    this.#steering.set(sessionId, direction);
  }

  /** Marks a connected match participant as temporarily unavailable. */
  drop(sessionId: string, now = this.#now()): void {
    if (!this.isInMatch(sessionId) || this.#state.matchStatus === "complete") return;
    this.#reconnectionDeadlines.set(sessionId, now + RECONNECTION_GRACE_MS);
  }

  /** Cancels a pending abandonment when the same session reconnects. */
  reconnect(sessionId: string): void {
    this.#reconnectionDeadlines.delete(sessionId);
  }

  /** Advances continuous lateral movement and server-timed Rally transitions. */
  update(deltaTimeMs: number, now = this.#now()): void {
    this.#expireReconnects(now);
    if (this.#state.matchStatus === "complete") {
      if (now >= this.#celebrationEndsAt) this.#finishCelebration(now);
      return;
    }
    if (this.#match === null) {
      this.#startIfReady(now);
      return;
    }
    this.#moveParticipants(deltaTimeMs);

    if (this.#state.matchStatus === "countdown") {
      if (now < this.#state.countdownEndsAt) return;
      this.#state.matchStatus = "rally";
      this.#launchRally(this.#match.rally, now);
      return;
    }

    if (this.#state.matchStatus !== "rally" || this.#state.ball === undefined) return;
    if (now < this.#state.ball.contactAt) return;
    this.#resolveContact(now);
  }

  /** Removes a queue/match seat when Colyseus finally considers the client gone. */
  removePlayer(sessionId: string, now = this.#now()): void {
    this.#steering.delete(sessionId);
    if (this.isInMatch(sessionId)) {
      if (this.#state.matchStatus === "complete") {
        this.#enrolled.delete(sessionId);
        return;
      }
      const deadline = this.#reconnectionDeadlines.get(sessionId);
      if (deadline !== undefined && now < deadline) return;
      this.#reconnectionDeadlines.delete(sessionId);
      this.#enrolled.delete(sessionId);
      this.#resolveAbandonment(sessionId, now);
      return;
    }
    this.leave(sessionId, now);
  }

  #startIfReady(now: number) {
    if (this.#match !== null) return;
    const shouldStartCoach =
      this.#line.playerIds.length === 1 &&
      shouldPairSoloHumanWithCoach({
        lobbyPlayerCount: this.#room.playerCount(),
        queuedPlayerCount: this.#line.playerIds.length,
        secondsAlone:
          this.#soloQueuedAt === 0 ? 0 : Math.max(0, (now - this.#soloQueuedAt) / 1_000),
      });
    if (this.#line.playerIds.length < 2 && !shouldStartCoach) return;

    const matchLine = shouldStartCoach
      ? { ...this.#line, playerIds: [...this.#line.playerIds, TENNIS_COACH_ID] }
      : this.#line;
    const result = startNextTennisMatch(matchLine, this.#random, this.#rules);
    if (result.match === null) return;

    this.#line = shouldStartCoach ? { ...this.#line, playerIds: [] } : result.line;
    this.#soloQueuedAt = 0;
    this.#match = result.match;
    this.#celebrationEndsAt = 0;
    this.#state.matchStatus = "countdown";
    this.#state.countdownEndsAt = now + COUNTDOWN_MS;
    this.#state.winnerId = "";
    this.#state.ball = undefined;
    this.#state.participants.clear();
    this.#syncScore();
    this.#syncQueue();
    this.#positionQueuedPlayers();

    for (const side of ["top", "bottom"] as const) {
      const sessionId = this.#match.playerBySide[side];
      const participant = new TennisParticipantState();
      participant.kind = sessionId === TENNIS_COACH_ID ? "coach" : "player";
      participant.side = side;
      participant.x = spawnFor(side).x;
      this.#state.participants.set(sessionId, participant);
      this.#placeParticipant(sessionId, side, participant.x);
      if (sessionId !== TENNIS_COACH_ID) this.#steering.set(sessionId, null);
    }

    this.#room.broadcast(TENNIS_EVENT, {
      code: "match-started",
      params: {
        topPlayerId: this.#match.playerBySide.top,
        bottomPlayerId: this.#match.playerBySide.bottom,
      },
    });
  }

  #moveParticipants(deltaTimeMs: number) {
    if (this.#state.matchStatus !== "rally") return;
    const elapsedSeconds = Math.min(Math.max(deltaTimeMs, 0), 250) / 1_000;
    for (const side of ["top", "bottom"] as const) {
      if (this.#match === null) return;
      const sessionId = this.#match.playerBySide[side];
      const participant = this.#state.participants.get(sessionId);
      if (!participant) continue;
      if (sessionId === TENNIS_COACH_ID) {
        const rally = this.#match.rally;
        if (rally?.receivingSide !== side) continue;
        const step =
          this.#coachDifficulty.moveTilesPerSecond * this.#rules.court.tileSize * elapsedSeconds;
        participant.x = moveToward(participant.x, rally.targetX, step);
        participant.x = clamp(participant.x, spawnFor(side).xMin, spawnFor(side).xMax);
        continue;
      }
      const direction = this.#steering.get(sessionId);
      if (direction === "left") participant.x -= LATERAL_SPEED * elapsedSeconds;
      if (direction === "right") participant.x += LATERAL_SPEED * elapsedSeconds;
      participant.x = clamp(participant.x, spawnFor(side).xMin, spawnFor(side).xMax);
      this.#placeParticipant(sessionId, side, participant.x);
    }
  }

  #resolveContact(now: number) {
    if (this.#match === null || this.#state.ball === undefined) return;
    const receivingSide = this.#match.rally?.receivingSide;
    if (receivingSide === undefined) return;
    const receivingPlayerId = this.#match.playerBySide[receivingSide];
    const participant = this.#state.participants.get(receivingPlayerId);
    if (!participant) return;

    const coachMisses =
      receivingPlayerId === TENNIS_COACH_ID && shouldCoachMiss(this.#random, this.#coachDifficulty);
    const attemptX = coachMisses
      ? participant.x + this.#rules.court.tileSize * (this.#rules.court.contactToleranceTiles + 1)
      : participant.x;
    const result = attemptRebound(this.#match, receivingSide, attemptX, this.#random, this.#rules);
    this.#match = result.match;
    this.#syncScore();

    if (result.outcome === "rebounded") {
      this.#room.broadcast(TENNIS_EVENT, {
        code: "rebound",
        params: {
          playerId: receivingPlayerId,
          side: receivingSide,
          reboundCount: result.match.rally?.reboundCount ?? 0,
        },
      });
      this.#launchRally(result.match.rally, now);
      return;
    }

    this.#room.broadcast(TENNIS_EVENT, {
      code: "point-scored",
      params: {
        winnerId: result.pointWonBy,
        topScore: this.#state.score.top,
        bottomScore: this.#state.score.bottom,
      },
    });
    this.#notifyNextPlayers();

    if (result.outcome === "match-complete") {
      this.#completeMatch(result.pointWonBy, "points", now);
      return;
    }

    this.#scheduleRally(result.match.rally, now);
  }

  #scheduleRally(rally: TennisMatch["rally"], now: number) {
    if (rally === null || this.#match === null) return;
    this.#state.ball = undefined;
    this.#state.matchStatus = "countdown";
    this.#state.countdownEndsAt = now + POINT_PAUSE_MS;
    for (const sessionId of this.#match.players) this.#steering.set(sessionId, null);
  }

  #launchRally(rally: TennisMatch["rally"], launchedAt: number) {
    if (rally === null || this.#match === null) return;
    const fromPlayerId = this.#match.playerBySide[rally.fromSide];
    const fromParticipant = this.#state.participants.get(fromPlayerId);
    const startX = fromParticipant?.x ?? spawnFor(rally.fromSide).x;
    const travelMs = (Math.abs(bottomSpawn.y - topSpawn.y) / rally.speed) * 1_000;
    const ball = new TennisBallState();
    ball.fromSide = rally.fromSide;
    ball.receivingSide = rally.receivingSide;
    ball.startX = startX;
    ball.targetX = rally.targetX;
    ball.speed = rally.speed;
    ball.reboundCount = rally.reboundCount;
    ball.launchedAt = launchedAt;
    ball.bounceAt = launchedAt + travelMs * BOUNCE_FRACTION;
    ball.contactAt = launchedAt + travelMs;
    this.#state.ball = ball;
    this.#state.matchStatus = "rally";
    this.#state.countdownEndsAt = 0;
  }

  #syncQueue() {
    this.#state.queue.splice(0, this.#state.queue.length, ...this.#line.playerIds);
  }

  #syncScore() {
    if (this.#match === null) return;
    this.#state.score.top = this.#match.score[this.#match.playerBySide.top] ?? 0;
    this.#state.score.bottom = this.#match.score[this.#match.playerBySide.bottom] ?? 0;
    this.#state.servingSide = this.#match.servingSide;
  }

  #positionQueuedPlayers() {
    this.#line.playerIds.forEach((sessionId, position) => {
      const marker = PLAZA_V2_TENNIS_LINE[position];
      if (!marker) return;
      const player = this.#room.player(sessionId);
      if (!player) return;
      player.x = Math.floor(marker.x / 16);
      player.y = Math.floor(marker.y / 16);
      player.direction = "up";
      player.dance = "";
    });
  }

  #placeParticipant(sessionId: string, side: TennisSide, x: number) {
    if (sessionId === TENNIS_COACH_ID) return;
    const player = this.#room.player(sessionId);
    if (!player) return;
    player.x = Math.floor(x / 16);
    player.y = Math.floor(spawnFor(side).y / 16);
    player.direction = side === "top" ? "down" : "up";
    player.dance = "";
    player.carId = "";
  }

  #notifyNextPlayers() {
    if (this.#match === null) return;
    const topScore = this.#state.score.top;
    const bottomScore = this.#state.score.bottom;
    if (topScore < 4 && bottomScore < 4) return;
    this.#line.playerIds.slice(0, 2).forEach((sessionId, position) => {
      this.#room.client(sessionId)?.send(TENNIS_NOTICE, {
        code: "you-are-next",
        params: { position },
      });
    });
  }

  #expireReconnects(now: number) {
    for (const [sessionId, deadline] of this.#reconnectionDeadlines) {
      if (deadline > now) continue;
      this.#reconnectionDeadlines.delete(sessionId);
      if (this.isInMatch(sessionId)) this.#resolveAbandonment(sessionId, now);
    }
  }

  #resolveAbandonment(abandonedId: string, now: number) {
    if (this.#match === null || this.#state.matchStatus === "complete") return;
    const winnerId = this.#match.players.find((playerId) => playerId !== abandonedId);
    if (winnerId === undefined) return;
    this.#completeMatch(winnerId, "abandonment", now);
  }

  #completeMatch(winnerId: string, reason: "points" | "abandonment", now: number) {
    const finishedPlayers = this.#match?.players ?? [];
    this.#match = null;
    this.#steering.clear();
    this.#reconnectionDeadlines.clear();
    for (const sessionId of finishedPlayers) this.#enrolled.delete(sessionId);
    this.#state.participants.clear();
    this.#sendPlayersToHall(finishedPlayers);
    this.#state.matchStatus = "complete";
    this.#state.winnerId = winnerId;
    this.#state.countdownEndsAt = 0;
    this.#state.ball = undefined;
    this.#celebrationEndsAt = now + CELEBRATION_MS;
    this.#room.broadcast(TENNIS_EVENT, {
      code: "match-complete",
      params: { winnerId, reason },
    });
    const winner = this.#room.player(winnerId);
    if (winner) {
      const celebration: ConfettiThrown = {
        throwerId: winnerId,
        direction: "down",
        target: { at: { x: winner.x, y: winner.y }, onPlayer: true },
      };
      this.#room.broadcast(CONFETTI_THROWN, celebration);
    }
  }

  #finishCelebration(now: number) {
    if (this.#state.matchStatus !== "complete") return;
    this.#state.matchStatus = "idle";
    this.#state.countdownEndsAt = 0;
    this.#state.winnerId = "";
    this.#state.ball = undefined;
    this.#state.participants.clear();
    this.#state.score.top = 0;
    this.#state.score.bottom = 0;
    this.#state.servingSide = "top";
    this.#celebrationEndsAt = 0;
    this.#startIfReady(now);
  }

  #sendPlayersToHall(sessionIds: readonly string[]) {
    let markerIndex = 0;
    sessionIds.forEach((sessionId) => {
      if (sessionId === TENNIS_COACH_ID) return;
      const marker = PLAZA_V2_TENNIS_LINE[markerIndex];
      markerIndex += 1;
      const player = this.#room.player(sessionId);
      if (!marker || !player) return;
      player.x = Math.floor(marker.x / 16);
      player.y = Math.floor(marker.y / 16);
      player.direction = "up";
      player.dance = "";
      player.carId = "";
    });
  }
}

function findCourtPoint(name: string) {
  const point = PLAZA_V2_TENNIS_COURT.find((entry) => entry.name === name);
  if (!point || !("xMin" in point) || !("xMax" in point)) {
    throw new Error(`Missing Tennis court spawn: ${name}`);
  }
  return point;
}

function spawnFor(side: TennisSide) {
  return side === "top" ? topSpawn : bottomSpawn;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function moveToward(current: number, target: number, distance: number): number {
  if (Math.abs(target - current) <= distance) return target;
  return current + Math.sign(target - current) * distance;
}
