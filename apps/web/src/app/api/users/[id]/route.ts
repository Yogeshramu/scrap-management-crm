import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';
import bcrypt from 'bcryptjs';

export const PUT = withMiddleware(async (req: NextRequest) => {
  try {
    const id = parseInt(req.nextUrl.pathname.split('/').at(-1)!);
    const { name, role, password } = await req.json();
    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true, username: true } });
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const data: any = {};
    if (name) data.name = name;
    if (role) data.role = role;
    if (password) data.passwordHash = await bcrypt.hash(password, 12);

    const updated = await prisma.user.update({ where: { id }, data, select: { id: true, username: true, name: true, role: true, createdAt: true } });
    await prisma.auditLog.create({ data: { action: `UPDATED USER: ${updated.username}`, performedBy: 'Admin', details: `Role: ${updated.role}` } });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'ADMIN', idempotent: true });

export const DELETE = withMiddleware(async (req: NextRequest) => {
  try {
    const id = parseInt(req.nextUrl.pathname.split('/').at(-1)!);
    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'ADMIN' });
