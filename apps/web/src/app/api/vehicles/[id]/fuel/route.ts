import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';

export const POST = withMiddleware(async (req: NextRequest) => {
  try {
    const vehicleId = parseInt(req.nextUrl.pathname.split('/').at(-2)!);
    const { date, amount, cost, odometer } = await req.json();
    const fuel = await prisma.vehicleFuel.create({
      data: { vehicleId, date: new Date(date), amount: parseFloat(amount) || 0, cost: parseFloat(cost) || 0, odometer: odometer ? parseFloat(odometer) : null },
    });
    await prisma.cashBook.create({ data: { type: 'OUT', category: 'TRANSPORT', amount: parseFloat(cost) || 0, referenceId: `FUEL-${fuel.id}`, description: `Fuel: ${amount}L on vehicle ID ${vehicleId}` } });
    return NextResponse.json(fuel);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'STAFF', idempotent: true });
