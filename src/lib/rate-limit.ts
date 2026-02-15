/**
 * Simple in-memory sliding-window rate limiter for server actions.
 * Uses the authenticated user ID as the key.
 *
 * Usage:
 *   const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
 *   // In a server action:
 *   limiter.check(userId); // throws if rate limited
 */

const stores = new Map<string, Map<string, number[]>>();

interface RateLimiterOptions {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export function createRateLimiter({ maxRequests, windowMs }: RateLimiterOptions) {
  const id = Math.random().toString(36);
  stores.set(id, new Map());

  return {
    check(key: string) {
      const store = stores.get(id)!;
      const now = Date.now();
      const timestamps = store.get(key) ?? [];

      // Remove expired timestamps
      const valid = timestamps.filter((t) => now - t < windowMs);

      if (valid.length >= maxRequests) {
        throw new Error("Too many requests. Please try again later.");
      }

      valid.push(now);
      store.set(key, valid);
    },
  };
}
