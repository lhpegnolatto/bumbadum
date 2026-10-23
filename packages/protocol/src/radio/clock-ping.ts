import { z } from "zod";

/**
 * Client → server: a clock ping, carrying the client's own send time, which
 * the server only echoes back. The client estimates its offset to the server
 * clock from the answers (ADR-0004).
 */
export const CLOCK_PING = "clock-ping";

export const clockPingSchema = z.object({
  sentAt: z.number().finite(),
});
export type ClockPing = z.infer<typeof clockPingSchema>;

/** Server → the pinging client: its ping's send time and the server time when answering. */
export const CLOCK_PONG = "clock-pong";

export interface ClockPong {
  sentAt: number;
  serverTime: number;
}
