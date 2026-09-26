/** Tiny in-memory attempt limiter, used to slow down password guessing and
 * mass sign-ups. It resets when the server restarts and isn't shared between
 * multiple server instances — swap for Redis/etc. if you scale out. */

type Bucket = { count: number; resetAt: number };

const globalForLimit = globalThis as unknown as { __photoboothBuckets?: Map<string, Bucket> };
const buckets = (globalForLimit.__photoboothBuckets ??= new Map<string, Bucket>());

function prune(now: number) {
  if (buckets.size < 1000) return;
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
}

/** Returns 0 if the caller may proceed, otherwise the seconds until they may retry. */
export function retryAfterSeconds(key: string, max: number): number {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) return 0;
  return b.count >= max ? Math.ceil((b.resetAt - now) / 1000) : 0;
}

/** Counts one attempt against `key` for the next `windowMs`. */
export function recordAttempt(key: string, windowMs: number) {
  const now = Date.now();
  prune(now);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) buckets.set(key, { count: 1, resetAt: now + windowMs });
  else b.count += 1;
}

export function clearAttempts(key: string) {
  buckets.delete(key);
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
