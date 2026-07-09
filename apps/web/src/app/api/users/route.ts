import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(users);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username, password, name, role } = await req.json();
    if (!username || !password || !name) {
      return NextResponse.json({ error: 'username, password and name are required' }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });

    const user = await prisma.user.create({
      data: { username, passwordHash: password, name, role: role || 'STAFF' },
      select: { id: true, username: true, name: true, role: true, createdAt: true },
    });
    await prisma.auditLog.create({
      data: { action: `CREATED USER: ${username}`, performedBy: 'Admin', details: `Role: ${role || 'STAFF'}` },
    });
    return NextResponse.json(user);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
