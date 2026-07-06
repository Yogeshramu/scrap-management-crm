import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const vehicleId = parseInt(id);
    const { date, amount, cost, odometer } = await req.json();

    const fuel = await prisma.vehicleFuel.create({
      data: {
        vehicleId,
        date: new Date(date),
        amount: parseFloat(amount) || 0,
        cost: parseFloat(cost) || 0,
        odometer: odometer ? parseFloat(odometer) : null,
      },
    });

    await prisma.cashBook.create({
      data: {
        type: 'OUT',
        category: 'TRANSPORT',
        amount: parseFloat(cost) || 0,
        referenceId: `FUEL-${fuel.id}`,
        description: `Fuel purchase: ${amount} liters on vehicle ID ${vehicleId}`,
      },
    });

    return NextResponse.json(fuel);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}