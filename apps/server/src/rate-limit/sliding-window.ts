export interface SlidingWindowRate {
  /** How many actions any window may hold. */
  limit: number;
  windowMs: number;
}

/**
 * A per-player rate limit that is exact: no window of `windowMs` ever holds
 * more than `limit` allowed actions. Stricter than a `TokenBucket`, whose
 * burst plus refill lets more through in one window; meant for scarce
 * resources such as the daily search quota.
 */
export class SlidingWindow {
  /** When each allowed action within the last window happened, oldest first. */
  private readonly allowedAt: number[] = [];

  constructor(private readonly rate: SlidingWindowRate) {}

  /** Records an action at `nowMs`; `false` means it is over the limit and was not counted. */
  take(nowMs: number): boolean {
    while (this.allowedAt.length > 0 && (this.allowedAt[0] ?? 0) <= nowMs - this.rate.windowMs) {
      this.allowedAt.shift();
    }
    if (this.allowedAt.length >= this.rate.limit) return false;
    this.allowedAt.push(nowMs);
    return true;
  }
}
