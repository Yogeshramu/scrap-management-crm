import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, phone } = await req.json();

    const existing = await prisma.transportCompany.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return NextResponse.json({ error: 'Transporter not found' }, { status: 404 });

    const updated = await prisma.transportCompany.update({
      where: { id: parseInt(id) },
      data: {
        name: name ?? existing.name,
        phone: phone ?? existing.phone,
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}