import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';

export const POST = withMiddleware(async (req: NextRequest) => {
  try {
    const vehicleId = parseInt(req.nextUrl.pathname.split('/').at(-2)!);
    const { date, service, cost, workshop } = await req.json();
    const maintenance = await prisma.vehicleMaintenance.create({
      data: { vehicleId, date: new Date(date), service, cost: parseFloat(cost) || 0, workshop: workshop || '' },
    });
    await prisma.cashBook.create({ data: { type: 'OUT', category: 'TRANSPORT', amount: parseFloat(cost) || 0, referenceId: `MAINT-${maintenance.id}`, description: `Maintenance: ${service} on vehicle ID ${vehicleId}` } });
    return NextResponse.json(maintenance);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'STAFF', idempotent: true });
