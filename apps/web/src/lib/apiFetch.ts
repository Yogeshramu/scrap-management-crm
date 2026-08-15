'use client';

let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = fetch('/api/auth/refresh', { method: 'POST' })
    .then(r => r.ok)
    .catch(() => false)
    .finally(() => { refreshing = null; });
  return refreshing;
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Per-request idempotency keys: keyed by (method + url + body-hash)
// Reuse the same key if the same request is retried within the session
const idemKeys = new Map<string, string>();

function getIdempotencyKey(input: RequestInfo, init?: RequestInit): string | null {
  const method = (init?.method ?? 'GET').toUpperCase();
  if (!['POST', 'PUT', 'DELETE'].includes(method)) return null;
  const url = typeof input === 'string' ? input : input.toString();
  const body = typeof init?.body === 'string' ? init.body : '';
  const cacheKey = `${method}:${url}:${body.slice(0, 200)}`;
  if (!idemKeys.has(cacheKey)) idemKeys.set(cacheKey, uuid());
  return idemKeys.get(cacheKey)!;
}

function clearIdempotencyKey(input: RequestInfo, init?: RequestInit) {
  const method = (init?.method ?? 'GET').toUpperCase();
  const url = typeof input === 'string' ? input : input.toString();
  const body = typeof init?.body === 'string' ? init.body : '';
  idemKeys.delete(`${method}:${url}:${body.slice(0, 200)}`);
}

export async function apiFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const idemKey = getIdempotencyKey(input, init);
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> ?? {}),
    ...(idemKey ? { 'Idempotency-Key': idemKey } : {}),
  };

  let res = await fetch(input, { ...init, headers });

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await fetch(input, { ...init, headers });
    } else {
      window.location.href = '/login';
      return res;
    }
  }

  // On success of a mutation, clear the idempotency key so next distinct call gets a fresh key
  if (res.ok && idemKey && !res.headers.get('X-Idempotent-Replayed')) {
    clearIdempotencyKey(input, init);
  }

  return res;
}
