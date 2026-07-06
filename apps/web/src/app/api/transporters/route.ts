import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const companies = await prisma.transportCompany.findMany({
      include: {
        trips: true,
        payments: true,
      },
    });

    const summary = companies.map((company) => {
      const totalTrips = company.trips.length;
      const totalAmount = company.trips.reduce((sum: number, trip) => sum + (trip.transportTripFee || 0), 0);
      const paidAmount = company.payments.reduce((sum: number, payment) => sum + payment.amountPaid, 0);
      const outstandingAmount = totalAmount - paidAmount;

      return {
        id: company.id,
        name: company.name,
        phone: company.phone,
        totalTrips,
        totalAmount,
        paid: paidAmount,
        outstanding: outstandingAmount,
      };
    });

    return NextResponse.json(summary);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}