import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';
import { withRetry } from '@/lib/retry';
import bcrypt from 'bcryptjs';

export const GET = withMiddleware(async () => {
  const users = await withRetry(() => prisma.user.findMany({
    select: { id: true, username: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  }));
  return NextResponse.json(users);
}, { minRole: 'ADMIN' });

export const POST = withMiddleware(async (req: NextRequest) => {
  try {
    const { username, password, name, role } = await req.json();
    if (!username || !password || !name) {
      return NextResponse.json({ error: 'username, password and name are required' }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await withRetry(() => prisma.user.create({
      data: { username, passwordHash, name, role: role || 'STAFF' },
      select: { id: true, username: true, name: true, role: true, createdAt: true },
    }));
    prisma.auditLog.create({
      data: { action: `CREATED USER: ${username}`, performedBy: 'Admin', details: `Role: ${role || 'STAFF'}` },
    }).catch(console.error);
    return NextResponse.json(user, { status: 201 });
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'ADMIN', idempotent: true });
