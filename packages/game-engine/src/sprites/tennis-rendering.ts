import type { TennisState } from "@bumbadum/protocol";
import {
  type TennisBallPose,
  type TennisRacketFrame,
  type TennisSide,
  tennisBallPose,
  tennisRacketFrame,
} from "./tennis-animation.ts";

/** The server's pixel anchors for the two Tennis baselines. */
export const TENNIS_BASELINE_Y = { top: 66, bottom: 582 } as const;

export interface DrawnTennisParticipant {
  sessionId: string;
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

  return { status: state.matchStatus, participants, ball, rackets };
}
