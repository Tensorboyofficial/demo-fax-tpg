import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

interface RateLimitOptions {
  namespace: string;
  limit: number;
  windowMs: number;
}

export async function checkRateLimit(
  opts: RateLimitOptions,
): Promise<{ ok: boolean; retryAfterMs: number; remaining: number }> {
  const hdrs = await headers();
  const xff = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "unknown";
  const ip = xff.split(",")[0].trim() || "unknown";
  const key = `${opts.namespace}:${ip}`;

  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, retryAfterMs: 0, remaining: opts.limit - 1 };
  }

  if (existing.count >= opts.limit) {
    return { ok: false, retryAfterMs: Math.max(0, existing.resetAt - now), remaining: 0 };
  }

  existing.count += 1;
  return { ok: true, retryAfterMs: 0, remaining: opts.limit - existing.count };
}

export async function guardRate(
  namespace: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; error?: string }> {
  const res = await checkRateLimit({ namespace, limit, windowMs });
  if (res.ok) return { ok: true };
  const retrySec = Math.ceil(res.retryAfterMs / 1000);
  return {
    ok: false,
    error: `Rate limit reached — try again in ${retrySec}s.`,
  };
}
