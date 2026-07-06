import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, contact } = await req.json();
    const existing = await prisma.customer.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    const updated = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: { name: name ?? existing.name, contact: contact ?? existing.contact }
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
