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
      select: {
        id: true,
        type: true,
        date: true,
        pickupLocation: true,
        agreedPrice: true,
        vehicleModel: true,
        lotName: true,
        transportTripFee: true,
        transportPaymentStatus: true,
        supplier: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });
    return NextResponse.json(trips);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}