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
  idempotent?: boolean;
}

type Handler = (req: NextRequest, ctx: { user: Awaited<ReturnType<typeof getUser>> }) => Promise<NextResponse>;

async function runHandler(handler: Handler, req: NextRequest, ctx: { user: Awaited<ReturnType<typeof getUser>> }): Promise<NextResponse> {
  try {
    return await handler(req, ctx);
  } catch (e: any) {
    console.error(`[API] Unhandled error in ${req.method} ${req.nextUrl.pathname}:`, e?.message ?? e);
    return NextResponse.json({ error: e?.message ?? 'Internal server error' }, { status: 500 });
  }
}

export function withMiddleware(handler: Handler, opts: MiddlewareOptions = {}) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const ip = getIP(req);
    const method = req.method;

    // 1. Rate limit
    const rl = checkRateLimit(ip, method, req.nextUrl.pathname);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    // 2. Auth — get user once, reuse for both role check and handler ctx
    const user = await getUser(req);
    if (opts.minRole) {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const ROLE_RANK: Record<Role, number> = { STAFF: 0, MANAGER: 1, ADMIN: 2 };
      if (ROLE_RANK[user.role] < ROLE_RANK[opts.minRole]) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const ctx = { user };

    // 3. Idempotency (mutations only)
    if (opts.idempotent && (method === 'POST' || method === 'PUT')) {
      const key = req.headers.get('idempotency-key');
      if (key) {
        const cached = getIdempotencyResult(key);
        if (cached) {
          return NextResponse.json(cached.body, {
            status: cached.status,
            headers: { 'X-Idempotent-Replayed': 'true' },
          });
        }
        const res = await runHandler(handler, req, ctx);
        // Only cache if body is valid JSON and not a server error
        if (res.status < 500) {
          const body = await res.clone().json().catch(() => null);
          if (body !== null) setIdempotencyResult(key, res.status, body);
        }
        return res;
      }
    }

    return runHandler(handler, req, ctx);
  };
}
