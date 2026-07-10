import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from './auth';

export type Role = 'ADMIN' | 'MANAGER' | 'STAFF';

const ROLE_RANK: Record<Role, number> = { STAFF: 0, MANAGER: 1, ADMIN: 2 };

export async function getUser(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) return null;
  const payload = await verifyAccessToken(token);
  if (!payload) return null;
  return payload as { id: number; username: string; name: string; role: Role };
}

export async function requireRole(req: NextRequest, minRole: Role): Promise<NextResponse | null> {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (ROLE_RANK[user.role] < ROLE_RANK[minRole]) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null; // allowed
}
