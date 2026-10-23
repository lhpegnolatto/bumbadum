import { SERVER_URL } from "./server-url.ts";

/** A health check that hangs this long counts as unanswered and is tried again. */
const HEALTH_TIMEOUT_MS = 10_000;

const HEALTH_URL = new URL("/health", SERVER_URL);

/**
 * True once the server answers its health endpoint. Any request also wakes a
 * sleeping Render server, so a false answer still moves the wake-up along.
 */
export async function isServerAwake(): Promise<boolean> {
  try {
    const response = await fetch(HEALTH_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false;
  }
}
