export type { Direction } from "@bumbadum/world";
export { CAR_INTERACTION_RADIUS } from "@bumbadum/world";
export { type Camera, cameraOn } from "./camera.ts";
export {
  type AmbientLight,
  ambientLightMatrix,
  type Daylight,
  daylightAt,
  type Rgb,
} from "./daylight/daylight.ts";
export { carDepth, objectDepth, playerDepth } from "./depth.ts";
export {
  type DrawnConfettiThrow,
  type DrawnPlayer,
  type GameEngine,
  type GameEngineOptions,
  mountGameEngine,
} from "./game-engine.ts";
export { lampIntensity, lightAlpha, lightTarget, lightThresholds } from "./lighting.ts";
export {
  type CarAnimationState,
  type CarFrame,
  carEffectPose,
  carFrame,
  fxFrame,
} from "./movement/car-animation.ts";
export {
  type CarDriveInput,
  type CarDrivingTuning,
  type CarPoint,
  type CarPose,
  type CarVelocity,
  DEFAULT_CAR_DRIVING_TUNING,
  driveCar,
} from "./movement/car-driving.ts";
export { type CarControlIntent, CarInput } from "./movement/car-input.ts";
export { ambientFrame, ambientStartFrame } from "./sprites/ambient-animation.ts";
export {
  type CarFxTextures,
  CarRenderer,
  type CarRendererOptions,
  type CarRendererTextures,
} from "./sprites/car-renderer.ts";
export {
  createTennisBallTimeline,
  TENNIS_BALL_BOUNCE_FRAME_MS,
  TENNIS_BALL_BOUNCE_PROGRESS,
  TENNIS_BALL_FRAME_MS,
  TENNIS_BALL_IMPACT_FRAME_MS,
  TENNIS_BALL_TRAIL_FRAME_MS,
  TENNIS_RACKET_FRAME_MS,
  TENNIS_RACKET_PREPARATION_FRAMES,
  type TennisBallPhase,
  type TennisBallPose,
  type TennisBallTimeline,
  type TennisBallTimelineInput,
  type TennisPoint,
  type TennisRacketFrame,
  type TennisRacketFrameInput,
  type TennisSide,
  type TennisStroke,
  tennisBallPose,
  tennisRacketFrame,
} from "./sprites/tennis-animation.ts";
export {
  type DrawnTennisBall,
  type DrawnTennisParticipant,
  type DrawnTennisRacket,
  TENNIS_BASELINE_Y,
  type TennisRenderSnapshot,
  tennisRenderSnapshot,
} from "./sprites/tennis-rendering.ts";
export {
  type VisibleWindowRegion,
  visibleWindowRegions,
  type WindowFacade,
  type WindowOccluder,
} from "./window-occlusion.ts";
