// Server-side idempotency store
// Client sends `Idempotency-Key: <uuid>` header on POST/PUT
// Same key within TTL returns the cached response body

interface IdempotencyEntry {
  status: number;
  body: unknown;
  expiresAt: number;
}

const TTL = 24 * 60 * 60 * 1000; // 24 hours
const store = new Map<string, IdempotencyEntry>();

export function getIdempotencyResult(key: string): { status: number; body: unknown } | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { store.delete(key); return null; }
  return { status: entry.status, body: entry.body };
}

export function setIdempotencyResult(key: string, status: number, body: unknown) {
  store.set(key, { status, body, expiresAt: Date.now() + TTL });
}

// Cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store) {
      if (now > v.expiresAt) store.delete(k);
    }
  }, 3_600_000);
}
