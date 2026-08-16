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

// Safe JSON parse — never throws, returns null if body is empty or not JSON
export async function safeJson(res: Response): Promise<any> {
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) return null;
  const text = await res.text();
  if (!text || !text.trim()) return null;
  try { return JSON.parse(text); } catch { return null; }
}

export async function apiFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const idemKey = getIdempotencyKey(input, init);
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> ?? {}),
    ...(idemKey ? { 'Idempotency-Key': idemKey } : {}),
  };

  let res = await fetch(input, { ...init, headers });

  // ── Token expired: attempt silent refresh then retry once ──────────────
  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      // Clear the idempotency key so the retry gets a fresh one —
      // the original request never completed successfully
      if (idemKey) clearIdempotencyKey(input, init);
      const newIdemKey = getIdempotencyKey(input, init);
      const retryHeaders: Record<string, string> = {
        ...(init?.headers as Record<string, string> ?? {}),
        ...(newIdemKey ? { 'Idempotency-Key': newIdemKey } : {}),
      };
      res = await fetch(input, { ...init, headers: retryHeaders });
    } else {
      // Refresh token also expired — redirect to login
      if (typeof window !== 'undefined') window.location.href = '/login';
      // Return a synthetic JSON response so callers don't crash on .json()
      return new Response(JSON.stringify({ error: 'Session expired. Please log in again.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // ── On success of a mutation, clear idempotency key for next distinct call
  if (res.ok && idemKey && !res.headers.get('X-Idempotent-Replayed')) {
    clearIdempotencyKey(input, init);
  }

  // ── Wrap non-JSON error responses so callers can always call .json() ───
  const ct = res.headers.get('content-type') ?? '';
  if (!res.ok && !ct.includes('application/json')) {
    const statusMessages: Record<number, string> = {
      429: 'Too many requests. Please wait a moment and try again.',
      500: 'Server error. Please try again.',
      502: 'Service temporarily unavailable.',
      503: 'Service temporarily unavailable.',
      504: 'Request timed out. Please try again.',
    };
    const msg = statusMessages[res.status] ?? `Request failed with status ${res.status}`;
    return new Response(JSON.stringify({ error: msg }), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return res;
}
