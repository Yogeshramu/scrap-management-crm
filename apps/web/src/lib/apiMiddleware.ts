import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from './rateLimit';
import { getIdempotencyResult, setIdempotencyResult } from './idempotency';
import { requireRole, getUser } from './rbac';
import type { Role } from './rbac';

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

interface MiddlewareOptions {
  minRole?: Role;
  idempotent?: boolean; // apply idempotency check (POST/PUT mutations)
}

type Handler = (req: NextRequest, ctx: { user: Awaited<ReturnType<typeof getUser>> }) => Promise<NextResponse>;

export function withMiddleware(handler: Handler, opts: MiddlewareOptions = {}) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const ip = getIP(req);
    const method = req.method;

    // 1. Rate limit
    const rl = checkRateLimit(ip, method);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    // 2. Auth
    const user = await getUser(req);
    if (opts.minRole) {
      const deny = await requireRole(req, opts.minRole);
      if (deny) return deny;
    }

    // 3. Idempotency (mutations only)
    if (opts.idempotent && (method === 'POST' || method === 'PUT')) {
      const key = req.headers.get('idempotency-key');
      if (key) {
        const cached = getIdempotencyResult(key);
        if (cached) {
          return NextResponse.json(cached.body, { status: cached.status, headers: { 'X-Idempotent-Replayed': 'true' } });
        }
        // Run handler and cache result
        const res = await handler(req, { user });
        const body = await res.clone().json().catch(() => null);
        if (res.status < 500) setIdempotencyResult(key, res.status, body);
        return res;
      }
    }

    return handler(req, { user });
  };
}
