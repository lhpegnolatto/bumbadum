export type TennisSide = "top" | "bottom";
export type TennisStroke = "forehand" | "backhand";
export type TennisBallPhase =
  | "flight-before-bounce"
  | "bounce"
  | "flight-after-bounce"
  | "contact"
  | "complete";

export interface TennisPoint {
  x: number;
  y: number;
}

export interface TennisBallTimelineInput {
  from: TennisPoint;
  to: TennisPoint;
  launchedAt: number;
  contactAt: number;
}

export interface TennisBallTimeline {
  from: TennisPoint;
  to: TennisPoint;
  launchedAt: number;
  bounceAt: number;
  contactAt: number;
}

export interface TennisBallTrail {
  frame: 0 | 1;
  mirrored: boolean;
}

export interface TennisBallPose {
  phase: TennisBallPhase;
  ground: TennisPoint;
  position: TennisPoint;
  height: number;
  shadow: TennisPoint;
  frame: 0 | 1 | 2;
  trail?: TennisBallTrail;
  contact: boolean;
  impactFrame?: 0 | 1 | 2;
}

export interface TennisRacketFrameInput {
  side: TennisSide;
  playerX: number;
  ballX: number;
  now: number;
  contactAt: number;
}

export interface TennisRacketFrame {
  side: TennisSide;
  stroke: TennisStroke;
  row: 0 | 1 | 2 | 3;
  column: 0 | 1 | 2 | 3;
}

export const TENNIS_BALL_BOUNCE_PROGRESS = 0.68;
export const TENNIS_BALL_FRAME_MS = 100;
export const TENNIS_BALL_TRAIL_FRAME_MS = 50;
export const TENNIS_BALL_BOUNCE_FRAME_MS = 50;
export const TENNIS_BALL_IMPACT_FRAME_MS = 50;
export const TENNIS_RACKET_FRAME_MS = 50;
export const TENNIS_RACKET_PREPARATION_FRAMES = 5;

/** Creates the timestamp timeline shared by the ball pose and its effects. */
export function createTennisBallTimeline(input: TennisBallTimelineInput): TennisBallTimeline {
  if (input.contactAt <= input.launchedAt) {
    throw new RangeError("Tennis ball contact must happen after launch");
  }

  return {
    from: input.from,
    to: input.to,
    launchedAt: input.launchedAt,
    bounceAt: input.launchedAt + (input.contactAt - input.launchedAt) * TENNIS_BALL_BOUNCE_PROGRESS,
    contactAt: input.contactAt,
  };
}

/** Calculates the ball, shadow and contact effects for one explicit timestamp. */
export function tennisBallPose(timeline: TennisBallTimeline, now: number): TennisBallPose {
  const ground = groundPosition(timeline, now);
  const isBeforeLaunch = now < timeline.launchedAt;
  const isBounce =
    now >= timeline.bounceAt && now < timeline.bounceAt + TENNIS_BALL_BOUNCE_FRAME_MS;
  const impactElapsed = now - timeline.contactAt;
  const impactFrame = impactFrameAt(impactElapsed);
  const isContact = impactFrame !== undefined;
  const isComplete = now >= timeline.contactAt + TENNIS_BALL_IMPACT_FRAME_MS * 3;
  const phase = isBeforeLaunch
    ? "flight-before-bounce"
    : isComplete
      ? "complete"
      : isContact
        ? "contact"
        : isBounce
          ? "bounce"
          : now < timeline.bounceAt
            ? "flight-before-bounce"
            : "flight-after-bounce";
  const height = ballHeight(timeline, now, phase);
  const frame = ballFrame(timeline, now, phase);
  const pose = {
    phase,
    ground,
    position: { x: ground.x, y: ground.y - height },
    height,
    shadow: ground,
    frame,
    contact: isContact,
    ...(impactFrame === undefined ? {} : { impactFrame }),
  } satisfies TennisBallPose;

  if (phase === "flight-before-bounce" || phase === "flight-after-bounce") {
    return {
      ...pose,
      trail: {
        frame: (Math.floor(Math.max(0, now - timeline.launchedAt) / TENNIS_BALL_TRAIL_FRAME_MS) %
          2) as 0 | 1,
        mirrored: timeline.to.x < timeline.from.x,
      },
    };
  }

  return pose;
}

/** Chooses a racket row and timed column for one participant's incoming ball. */
export function tennisRacketFrame(input: TennisRacketFrameInput): TennisRacketFrame {
  const stroke = racketStroke(input.side, input.playerX, input.ballX);
  const preparationAt = input.contactAt - TENNIS_RACKET_PREPARATION_FRAMES * TENNIS_RACKET_FRAME_MS;
  const column =
    input.now < preparationAt
      ? 0
      : input.now < input.contactAt
        ? 1
        : input.now < input.contactAt + TENNIS_RACKET_FRAME_MS
          ? 2
          : 3;

  return {
    side: input.side,
    stroke,
    row: racketRow(input.side, stroke),
    column,
  };
}

function groundPosition(timeline: TennisBallTimeline, now: number): TennisPoint {
  const elapsed = now - timeline.launchedAt;
  const duration = timeline.contactAt - timeline.launchedAt;
  const progress = clamp(elapsed / duration, 0, 1);
  return interpolate(timeline.from, timeline.to, progress);
}

function ballHeight(timeline: TennisBallTimeline, now: number, phase: TennisBallPhase): number {
  if (phase === "complete" || phase === "contact") return 0;
  if (phase === "flight-before-bounce") {
    const progress = clamp(
      (now - timeline.launchedAt) / (timeline.bounceAt - timeline.launchedAt),
      0,
      1,
    );
    return 120 * progress * (1 - progress);
  }

  const progress = clamp(
    (now - timeline.bounceAt) / (timeline.contactAt - timeline.bounceAt),
    0,
    1,
  );
  return 36 * progress * (1 - progress);
}

function ballFrame(timeline: TennisBallTimeline, now: number, phase: TennisBallPhase): 0 | 1 | 2 {
  if (phase === "bounce") return 2;
  if (phase === "contact" || phase === "complete") return 0;
  return (Math.floor(Math.max(0, now - timeline.launchedAt) / TENNIS_BALL_FRAME_MS) % 2) as 0 | 1;
}

function impactFrameAt(elapsed: number): 0 | 1 | 2 | undefined {
  if (elapsed < 0 || elapsed >= TENNIS_BALL_IMPACT_FRAME_MS * 3) return undefined;
  return Math.floor(elapsed / TENNIS_BALL_IMPACT_FRAME_MS) as 0 | 1 | 2;
}

function racketStroke(side: TennisSide, playerX: number, ballX: number): TennisStroke {
  const ballIsOnForehandSide = side === "bottom" ? ballX < playerX : ballX > playerX;
  return ballIsOnForehandSide ? "forehand" : "backhand";
}

function racketRow(side: TennisSide, stroke: TennisStroke): 0 | 1 | 2 | 3 {
  if (side === "bottom") return stroke === "forehand" ? 0 : 1;
  return stroke === "forehand" ? 2 : 3;
}

function interpolate(from: TennisPoint, to: TennisPoint, progress: number): TennisPoint {
  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress,
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
