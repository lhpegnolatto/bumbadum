import type { TennisParticipantKind, TennisState } from "@bumbadum/protocol";
import { PLAZA_V2_TENNIS_COURT } from "@bumbadum/world";
import {
  type TennisBallPose,
  type TennisRacketFrame,
  type TennisSide,
  tennisBallPose,
  tennisRacketFrame,
} from "./tennis-animation.ts";

function courtPoint(name: "player-top" | "player-bottom") {
  const point = PLAZA_V2_TENNIS_COURT.find((entry) => entry.name === name);
  if (!point) throw new Error(`Missing Tennis court point: ${name}`);
  return point;
}

/** The server's pixel anchors for the two Tennis baselines, sourced from the canonical map. */
export const TENNIS_BASELINE_Y = {
  top: courtPoint("player-top").y,
  bottom: courtPoint("player-bottom").y,
} as const;

export interface DrawnTennisParticipant {
  sessionId: string;
  kind: TennisParticipantKind;
  side: TennisSide;
  x: number;
  y: number;
}

export interface DrawnTennisBall {
  pose: TennisBallPose;
  fromSide: TennisSide;
  receivingSide: TennisSide;
  targetX: number;
  contactAt: number;
}

export interface DrawnTennisRacket {
  sessionId: string;
  frame: TennisRacketFrame;
}

export interface TennisRenderSnapshot {
  status: TennisState["matchStatus"];
  topScore: number;
  bottomScore: number;
  participants: DrawnTennisParticipant[];
  ball?: DrawnTennisBall;
  rackets: DrawnTennisRacket[];
}

/**
 * Converts the authoritative Tennis state into the values the Pixi layer draws.
 * The timestamp is an epoch timestamp because TennisState timestamps are server epoch ms.
 */
export function tennisRenderSnapshot(state: TennisState, now: number): TennisRenderSnapshot {
  const participants = [...state.participants].map(([sessionId, participant]) => ({
    sessionId,
    kind: participant.kind ?? "player",
    side: participant.side,
    x: participant.x,
    y: TENNIS_BASELINE_Y[participant.side],
  }));
  const ball = state.ball
    ? {
        pose: tennisBallPose(
          {
            from: {
              x: state.ball.startX,
              y: TENNIS_BASELINE_Y[state.ball.fromSide],
            },
            to: {
              x: state.ball.targetX,
              y: TENNIS_BASELINE_Y[state.ball.receivingSide],
            },
            launchedAt: state.ball.launchedAt,
            bounceAt: state.ball.bounceAt,
            contactAt: state.ball.contactAt,
          },
          now,
        ),
        fromSide: state.ball.fromSide,
        receivingSide: state.ball.receivingSide,
        targetX: state.ball.targetX,
        contactAt: state.ball.contactAt,
      }
    : undefined;
  const rackets = ball
    ? participants.map(({ sessionId, side, x }) => ({
        sessionId,
        frame: tennisRacketFrame({
          side,
          playerX: x,
          ballX: ball.targetX,
          now,
          contactAt: ball.contactAt,
        }),
      }))
    : [];

  return {
    status: state.matchStatus,
    topScore: state.score.top,
    bottomScore: state.score.bottom,
    participants,
    ball,
    rackets,
  };
}
