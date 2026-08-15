import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';

export const PUT = withMiddleware(async (req: NextRequest) => {
  try {
    const id = parseInt(req.nextUrl.pathname.split('/').at(-1)!);
    const { name, contact } = await req.json();
    const existing = await prisma.customer.findUnique({ where: { id }, select: { id: true, name: true, contact: true } });
    if (!existing) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    const updated = await prisma.customer.update({ where: { id }, data: { name: name ?? existing.name, contact: contact ?? existing.contact } });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'MANAGER', idempotent: true });
