import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireRole(req, 'ADMIN');
  if (deny) return deny;
  try {
    const { id } = await params;
    const { name, role, password } = await req.json();
    const existing = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const data: any = {};
    if (name) data.name = name;
    if (role) data.role = role;
    if (password) data.passwordHash = password;

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data,
      select: { id: true, username: true, name: true, role: true, createdAt: true },
    });
    await prisma.auditLog.create({
      data: { action: `UPDATED USER: ${updated.username}`, performedBy: 'Admin', details: `Role: ${updated.role}` },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireRole(req, 'ADMIN');
  if (deny) return deny;
  try {
    const { id } = await params;
    const existing = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    await prisma.user.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
