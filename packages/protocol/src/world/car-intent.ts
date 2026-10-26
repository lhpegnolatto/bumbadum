import { DIRECTIONS, type Direction } from "@bumbadum/world";
import { z } from "zod";

export const CAR_DRIVE_MESSAGE = "car-drive";
export const CAR_ENTER_MESSAGE = "car-enter";
export const CAR_EXIT_MESSAGE = "car-exit";

const carDriveIntentSchema = z.enum(DIRECTIONS).nullable();
const emptyIntentSchema = z.undefined();

export function parseCarDriveIntent(input: unknown): Direction | null | undefined {
  const result = carDriveIntentSchema.safeParse(input);
  return result.success ? result.data : undefined;
}

export function parseCarEnterIntent(input: unknown): true | undefined {
  return emptyIntentSchema.safeParse(input).success ? true : undefined;
}

export function parseCarExitIntent(input: unknown): true | undefined {
  return emptyIntentSchema.safeParse(input).success ? true : undefined;
}
