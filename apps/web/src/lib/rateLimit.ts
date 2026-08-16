// Sliding-window rate limiter — server-side only
// Limits: 60 req/min for GETs, 20 req/min for mutations per IP
// NOTE: In development, limits are relaxed to avoid blocking test runs
const isDev = process.env.NODE_ENV !== 'production';

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

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

export function checkRateLimit(ip: string, method: string, path = ''): { allowed: boolean; retryAfter?: number } {
  const cfg = LIMITS[method] ?? LIMITS.GET;
  const key = `${ip}:${method}:${path}`;
  const now = Date.now();

  let win = store.get(key);
  if (!win || now > win.resetAt) {
    win = { count: 1, resetAt: now + cfg.windowMs };
    store.set(key, win);
    return { allowed: true };
  }

  win.count++;
  if (win.count > cfg.max) {
    return { allowed: false, retryAfter: Math.ceil((win.resetAt - now) / 1000) };
  }
  return { allowed: true };
}

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store) {
      if (now > v.resetAt) store.delete(k);
    }
  }, 300_000);
}
