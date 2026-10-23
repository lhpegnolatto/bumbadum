export interface TokenBucketRate {
  /** How many actions may come in one burst. */
  capacity: number;
  /** How many actions per second it allows over time. */
  perSecond: number;
}

/** A per-player rate limit: each action takes a token, and tokens refill steadily. */
export class TokenBucket {
  private tokens: number;
  private refilledAt: number;

  constructor(
    private readonly rate: TokenBucketRate,
    nowMs: number,
  ) {
    this.tokens = rate.capacity;
    this.refilledAt = nowMs;
  }

  /** Takes a token for an action at `nowMs`; `false` means the action is over the limit. */
  take(nowMs: number): boolean {
    const elapsed = Math.max(0, nowMs - this.refilledAt) / 1000;
    this.tokens = Math.min(this.rate.capacity, this.tokens + elapsed * this.rate.perSecond);
    this.refilledAt = nowMs;
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}
