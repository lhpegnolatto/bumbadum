/** `HH:MM` on a 24-hour clock, 00:00 to 23:59. */
const CLOCK_TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * The Time of day on the device's clock at `date`, in hours since midnight with minutes and
 * seconds as fractions of the hour (18.5 is 18:30).
 */
export function deviceTimeOfDay(date: Date): number {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

/**
 * The Time of day that `?time=HH:MM` in the room URL's `search` fixes, to preview every Day
 * period in development; `undefined` without one, when malformed, or in a production build.
 */
export function timeOfDayOverride(search: string, production: boolean): number | undefined {
  if (production) return undefined;
  const match = CLOCK_TIME.exec(new URLSearchParams(search).get("time") ?? "");
  if (!match) return undefined;
  return Number(match[1]) + Number(match[2]) / 60;
}
