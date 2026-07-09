import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const trips = await prisma.purchase.findMany({
      where: {
        transportCompanyId: parseInt(id),
        transportTripFee: { not: null },
      },
      include: { supplier: true },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(trips);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}