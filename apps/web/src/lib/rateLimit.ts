import 'server-only';
import { redis } from './redis';

const isDev = process.env.NODE_ENV !== 'production';

const LIMITS: Record<string, { max: number; windowMs: number }> = isDev
  ? {
      GET:    { max: 500, windowMs: 60_000 },
      POST:   { max: 200, windowMs: 60_000 },
      PUT:    { max: 200, windowMs: 60_000 },
      DELETE: { max: 100, windowMs: 60_000 },
    }
  : {
      GET:    { max: 60,  windowMs: 60_000 },
      POST:   { max: 20,  windowMs: 60_000 },
      PUT:    { max: 20,  windowMs: 60_000 },
      DELETE: { max: 10,  windowMs: 60_000 },
    };

export async function checkRateLimit(
  ip: string,
  method: string,
  path = ''
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const cfg = LIMITS[method] ?? LIMITS.GET;
  const key = `rl:${ip}:${method}:${path}`;
  const windowS = Math.ceil(cfg.windowMs / 1000);

  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowS);

  if (count > cfg.max) {
    const ttl = await redis.ttl(key);
    return { allowed: false, retryAfter: ttl > 0 ? ttl : windowS };
  }
  return { allowed: true };
}
