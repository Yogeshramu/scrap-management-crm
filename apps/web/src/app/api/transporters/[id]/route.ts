import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';

export const PUT = withMiddleware(async (req: NextRequest) => {
  try {
    const id = parseInt(req.nextUrl.pathname.split('/').at(-1)!);
    const { name, phone } = await req.json();
    const existing = await prisma.transportCompany.findUnique({ where: { id }, select: { id: true, name: true, phone: true } });
    if (!existing) return NextResponse.json({ error: 'Transporter not found' }, { status: 404 });
    const updated = await prisma.transportCompany.update({ where: { id }, data: { name: name ?? existing.name, phone: phone ?? existing.phone } });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'MANAGER', idempotent: true });
