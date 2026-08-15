import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';

export const GET = withMiddleware(async (req: NextRequest) => {
  try {
    const id = parseInt(req.nextUrl.pathname.split('/').at(-2)!);
    const trips = await prisma.purchase.findMany({
      where: { transportCompanyId: id, transportTripFee: { not: null } },
      select: { id: true, type: true, date: true, pickupLocation: true, agreedPrice: true, vehicleModel: true, lotName: true, transportTripFee: true, transportPaymentStatus: true, supplier: { select: { name: true } } },
      orderBy: { date: 'desc' },
      take: 100,
    });
    return NextResponse.json(trips);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'STAFF' });
