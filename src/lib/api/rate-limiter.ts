/**
 * Token bucket rate limiter for OpenF1 API.
 * Free tier: 3 requests/second, 30 requests/minute.
 */

interface Bucket {
  tokens: number;
  maxTokens: number;
  refillIntervalMs: number;
  lastRefill: number;
}

export class RateLimiter {
  private perSecond: Bucket;
  private perMinute: Bucket;
  private queue: Array<{
    resolve: () => void;
    priority: number;
  }> = [];
  private processing = false;

  constructor() {
    const now = Date.now();
    this.perSecond = {
      tokens: 3,
      maxTokens: 3,
      refillIntervalMs: 1000,
      lastRefill: now,
    };
    this.perMinute = {
      tokens: 30,
      maxTokens: 30,
      refillIntervalMs: 60000,
      lastRefill: now,
    };
  }

  private refillBucket(bucket: Bucket): void {
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(elapsed / bucket.refillIntervalMs) * bucket.maxTokens;
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
  }

  private canConsume(): boolean {
    this.refillBucket(this.perSecond);
    this.refillBucket(this.perMinute);
    return this.perSecond.tokens > 0 && this.perMinute.tokens > 0;
  }

  private consume(): void {
    this.perSecond.tokens--;
    this.perMinute.tokens--;
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      if (this.canConsume()) {
        this.consume();
        // Sort by priority (higher = more important) before dequeueing
        this.queue.sort((a, b) => b.priority - a.priority);
        const next = this.queue.shift();
        next?.resolve();
      } else {
        // Wait before trying again
        await new Promise((r) => setTimeout(r, 350));
      }
    }

    this.processing = false;
  }

  async acquire(priority: number = 0): Promise<void> {
    if (this.canConsume()) {
      this.consume();
      return;
    }

    return new Promise<void>((resolve) => {
      this.queue.push({ resolve, priority });
      this.processQueue();
    });
  }
}

// Singleton instance for client-side usage
let clientRateLimiter: RateLimiter | null = null;

export function getClientRateLimiter(): RateLimiter {
  if (!clientRateLimiter) {
    clientRateLimiter = new RateLimiter();
  }
  return clientRateLimiter;
}
