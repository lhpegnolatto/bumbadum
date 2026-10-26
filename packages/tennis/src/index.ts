export type PlayerId = string;

export type TennisParticipant =
  | { readonly kind: "player"; readonly id: PlayerId }
  | { readonly kind: "coach"; readonly id: "coach" };

export const COACH_QUEUE_WAIT_SECONDS = 15;

export const FRIENDLY_COACH_DIFFICULTY = {
  reachTiles: 1,
  moveTilesPerSecond: 10,
  minMissChance: 0.05,
  maxMissChance: 0.2,
} as const;

export interface CoachDifficulty {
  readonly reachTiles: number;
  readonly moveTilesPerSecond: number;
  readonly minMissChance: number;
  readonly maxMissChance: number;
}

export function createCoachParticipant(): TennisParticipant {
  return { kind: "coach", id: "coach" };
}

export interface SoloCoachPairingInput {
  readonly lobbyPlayerCount: number;
  readonly queuedPlayerCount: number;
  readonly secondsAlone: number;
}

export function shouldPairSoloHumanWithCoach({
  lobbyPlayerCount,
  queuedPlayerCount,
  secondsAlone,
}: SoloCoachPairingInput): boolean {
  if (queuedPlayerCount !== 1 || lobbyPlayerCount < 1) {
    return false;
  }

  return lobbyPlayerCount === 1 || secondsAlone >= COACH_QUEUE_WAIT_SECONDS;
}

export type TennisSide = "top" | "bottom";

export interface RandomSource {
  next(): number;
}

export interface TennisCourtRules {
  singlesMinX: number;
  singlesMaxX: number;
  tileSize: number;
  targetMarginTiles: number;
}

export interface TennisRules {
  court: TennisCourtRules;
  initialBallSpeed: number;
  speedIncreasePerRebound: number;
  maxSpeedMultiplier: number;
  contactToleranceTiles: number;
}

export const DEFAULT_TENNIS_RULES: TennisRules = {
  court: {
    singlesMinX: 64,
    singlesMaxX: 272,
    tileSize: 16,
    targetMarginTiles: 1,
  },
  initialBallSpeed: 128,
  speedIncreasePerRebound: 0.1,
  maxSpeedMultiplier: 2,
  contactToleranceTiles: 1,
};

export function coachMissChance(
  ballSpeed: number,
  targetX: number,
  coachInitialX: number,
  rules: TennisRules = DEFAULT_TENNIS_RULES,
  difficulty: CoachDifficulty = FRIENDLY_COACH_DIFFICULTY,
): number {
  const speedRange = rules.initialBallSpeed * (rules.maxSpeedMultiplier - 1);
  const speedProgress =
    speedRange <= 0
      ? 1
      : Math.min(Math.max((ballSpeed - rules.initialBallSpeed) / speedRange, 0), 1);
  const firstTargetX =
    rules.court.singlesMinX + rules.court.targetMarginTiles * rules.court.tileSize;
  const lastTargetX =
    rules.court.singlesMaxX - rules.court.targetMarginTiles * rules.court.tileSize;
  const maximumTargetDistance = Math.max(
    Math.abs(firstTargetX - coachInitialX),
    Math.abs(lastTargetX - coachInitialX),
  );
  const distanceProgress =
    maximumTargetDistance <= 0
      ? 1
      : Math.min(Math.max(Math.abs(targetX - coachInitialX) / maximumTargetDistance, 0), 1);
  const challengeProgress = speedProgress * distanceProgress;
  return (
    difficulty.minMissChance +
    (difficulty.maxMissChance - difficulty.minMissChance) * challengeProgress
  );
}

export function shouldCoachMiss(
  random: RandomSource,
  ballSpeed: number,
  targetX: number,
  coachInitialX: number,
  rules: TennisRules = DEFAULT_TENNIS_RULES,
  difficulty: CoachDifficulty = FRIENDLY_COACH_DIFFICULTY,
): boolean {
  return random.next() < coachMissChance(ballSpeed, targetX, coachInitialX, rules, difficulty);
}

export function shouldCoachRebound(
  targetX: number,
  coachX: number,
  rules: TennisRules = DEFAULT_TENNIS_RULES,
  difficulty: CoachDifficulty = FRIENDLY_COACH_DIFFICULTY,
): boolean {
  return Math.abs(targetX - coachX) <= rules.court.tileSize * difficulty.reachTiles;
}

export interface TennisLine {
  readonly capacity: number;
  readonly playerIds: readonly PlayerId[];
}

export type JoinTennisLineStatus = "joined" | "already-joined" | "full";

export interface JoinTennisLineResult {
  readonly line: TennisLine;
  readonly status: JoinTennisLineStatus;
  readonly position: number | null;
}

export function createTennisLine(capacity: number): TennisLine {
  if (!Number.isInteger(capacity) || capacity < 2) {
    throw new RangeError("Tennis line capacity must be an integer of at least 2");
  }

  return { capacity, playerIds: [] };
}

export function joinTennisLine(line: TennisLine, playerId: PlayerId): JoinTennisLineResult {
  const currentPosition = line.playerIds.indexOf(playerId);
  if (currentPosition !== -1) {
    return { line, status: "already-joined", position: currentPosition };
  }

  if (line.playerIds.length >= line.capacity) {
    return { line, status: "full", position: null };
  }

  const position = line.playerIds.length;
  return {
    line: { ...line, playerIds: [...line.playerIds, playerId] },
    status: "joined",
    position,
  };
}

export function leaveTennisLine(line: TennisLine, playerId: PlayerId): TennisLine {
  const position = line.playerIds.indexOf(playerId);
  if (position === -1) {
    return line;
  }

  return {
    ...line,
    playerIds: line.playerIds.filter((currentPlayerId) => currentPlayerId !== playerId),
  };
}

export interface Rally {
  readonly fromSide: TennisSide;
  readonly receivingSide: TennisSide;
  readonly targetX: number;
  readonly speed: number;
  readonly reboundCount: number;
}

export type TennisMatchStatus = "rally" | "complete";

export interface TennisMatch {
  readonly players: readonly [PlayerId, PlayerId];
  readonly playerBySide: Readonly<Record<TennisSide, PlayerId>>;
  readonly servingSide: TennisSide;
  readonly score: Readonly<Record<PlayerId, number>>;
  readonly rally: Rally | null;
  readonly status: TennisMatchStatus;
  readonly winner: PlayerId | null;
}

export interface StartNextTennisMatchResult {
  readonly line: TennisLine;
  readonly match: TennisMatch | null;
}

export function startNextTennisMatch(
  line: TennisLine,
  random: RandomSource,
  rules: TennisRules = DEFAULT_TENNIS_RULES,
): StartNextTennisMatchResult {
  const firstPlayer = line.playerIds[0];
  const secondPlayer = line.playerIds[1];
  if (firstPlayer === undefined || secondPlayer === undefined) {
    return { line, match: null };
  }

  const firstSide = randomSide(random);
  const secondSide = oppositeSide(firstSide);
  const servingSide = randomSide(random);
  const receivingSide = oppositeSide(servingSide);

  const match: TennisMatch = {
    players: [firstPlayer, secondPlayer],
    playerBySide: {
      [firstSide]: firstPlayer,
      [secondSide]: secondPlayer,
    } as Record<TennisSide, PlayerId>,
    servingSide,
    score: { [firstPlayer]: 0, [secondPlayer]: 0 },
    rally: createRally(servingSide, receivingSide, rules.initialBallSpeed, 0, random, rules),
    status: "rally",
    winner: null,
  };

  return {
    line: { ...line, playerIds: line.playerIds.slice(2) },
    match,
  };
}

export type ReboundOutcome = "rebounded" | "missed" | "match-complete";

export type ReboundResult =
  | {
      readonly outcome: "rebounded";
      readonly match: TennisMatch;
    }
  | {
      readonly outcome: "missed";
      readonly match: TennisMatch;
      readonly pointWonBy: PlayerId;
    }
  | {
      readonly outcome: "match-complete";
      readonly match: TennisMatch;
      readonly pointWonBy: PlayerId;
    };

export function attemptRebound(
  match: TennisMatch,
  playerSide: TennisSide,
  playerX: number,
  random: RandomSource,
  rules: TennisRules = DEFAULT_TENNIS_RULES,
): ReboundResult {
  if (match.status === "complete" || match.rally === null) {
    throw new Error("A completed Tennis match has no active Rally");
  }

  const { rally } = match;
  const playerIsInContactZone =
    playerSide === rally.receivingSide &&
    Math.abs(playerX - rally.targetX) <= rules.court.tileSize * rules.contactToleranceTiles;

  if (playerIsInContactZone) {
    const speed = Math.min(
      rally.speed * (1 + rules.speedIncreasePerRebound),
      rules.initialBallSpeed * rules.maxSpeedMultiplier,
    );

    return {
      outcome: "rebounded",
      match: {
        ...match,
        rally: createRally(
          rally.receivingSide,
          oppositeSide(rally.receivingSide),
          speed,
          rally.reboundCount + 1,
          random,
          rules,
        ),
      },
    };
  }

  const pointWonBy = match.playerBySide[oppositeSide(rally.receivingSide)];
  const score = {
    ...match.score,
    [pointWonBy]: (match.score[pointWonBy] ?? 0) + 1,
  };
  if (score[pointWonBy] === 5) {
    return {
      outcome: "match-complete",
      pointWonBy,
      match: {
        ...match,
        score,
        rally: null,
        status: "complete",
        winner: pointWonBy,
      },
    };
  }

  const servingSide = oppositeSide(match.servingSide);
  return {
    outcome: "missed",
    pointWonBy,
    match: {
      ...match,
      servingSide,
      score,
      rally: createRally(
        servingSide,
        oppositeSide(servingSide),
        rules.initialBallSpeed,
        0,
        random,
        rules,
      ),
    },
  };
}

function randomSide(random: RandomSource): TennisSide {
  return random.next() < 0.5 ? "top" : "bottom";
}

function oppositeSide(side: TennisSide): TennisSide {
  return side === "top" ? "bottom" : "top";
}

function createRally(
  fromSide: TennisSide,
  receivingSide: TennisSide,
  speed: number,
  reboundCount: number,
  random: RandomSource,
  rules: TennisRules,
): Rally {
  return {
    fromSide,
    receivingSide,
    targetX: randomTargetX(random, rules.court),
    speed,
    reboundCount,
  };
}

function randomTargetX(random: RandomSource, court: TennisCourtRules): number {
  const courtWidthInTiles = (court.singlesMaxX - court.singlesMinX) / court.tileSize;
  const firstTargetTile = court.targetMarginTiles;
  const lastTargetTile = courtWidthInTiles - court.targetMarginTiles;
  const targetCount = lastTargetTile - firstTargetTile + 1;
  if (!Number.isInteger(courtWidthInTiles) || targetCount < 1) {
    throw new RangeError("Tennis singles boundaries must contain a target tile");
  }

  const randomIndex = Math.floor(normalizeRandom(random.next()) * targetCount);
  return court.singlesMinX + (firstTargetTile + randomIndex) * court.tileSize;
}

function normalizeRandom(value: number): number {
  return Math.min(Math.max(value, 0), 1 - Number.EPSILON);
}
