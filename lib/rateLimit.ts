/**
 * Naive in-memory rate limiting for route handlers.
 *
 * Deliberately simple: a per-instance sliding window, no Redis, no shared
 * state. On serverless each instance keeps its own counters, so the real
 * ceiling is (limit × warm instances) — a sanity cap against someone
 * scripting an endpoint, NOT a security boundary. That's the right trade
 * at wedding scale; anything stronger means adding infrastructure.
 *
 * Extracted from app/api/rsvp/[slug]/route.ts when the admin login needed
 * the same behaviour — one implementation, two callers.
 */
import "server-only";

type Window = { count: number; windowStart: number };

/** Above this many tracked keys, drop the expired ones before adding more. */
const PRUNE_THRESHOLD = 500;

export type RateLimiter = (key: string) => boolean;

/**
 * Returns a `limiter(key)` that reports whether this call EXCEEDS the
 * allowance. Each limiter owns its own counters, so callers don't collide.
 */
export function createRateLimiter(opts: {
  windowMs: number;
  max: number;
}): RateLimiter {
  const hits = new Map<string, Window>();

  return function rateLimited(key: string): boolean {
    const now = Date.now();
    const hit = hits.get(key);

    if (!hit || now - hit.windowStart > opts.windowMs) {
      // Keys are never removed on their own — sweep expired ones once the
      // map grows, so a spray of distinct IPs can't leak memory.
      if (hits.size > PRUNE_THRESHOLD) {
        for (const [k, v] of hits) {
          if (now - v.windowStart > opts.windowMs) hits.delete(k);
        }
      }
      hits.set(key, { count: 1, windowStart: now });
      return false;
    }

    hit.count += 1;
    return hit.count > opts.max;
  };
}

/**
 * Caller IP as reported by the proxy. Vercel sets x-forwarded-for; the
 * first entry is the client. Falls back to a constant, which buckets all
 * unknown callers together — deliberately strict rather than unlimited.
 */
export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
}
