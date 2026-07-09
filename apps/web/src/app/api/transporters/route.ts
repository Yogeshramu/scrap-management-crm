import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const companies = await prisma.transportCompany.findMany({
      include: { trips: true, payments: true },
    });

    const summary = companies.map((company) => {
      const validTrips = company.trips.filter(t => t.transportTripFee != null);
      const totalTrips = validTrips.length;
      const totalAmount = validTrips.reduce((sum, t) => sum + (t.transportTripFee ?? 0), 0);
      const paidAmount = validTrips
        .filter(t => t.transportPaymentStatus === 'PAID')
        .reduce((sum, t) => sum + (t.transportTripFee ?? 0), 0);
      const outstanding = totalAmount - paidAmount;

      return {
        id: company.id,
        name: company.name,
        phone: company.phone,
        totalTrips,
        totalAmount,
        paid: paidAmount,
        outstanding,
      };
    });

    return NextResponse.json(summary);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    const company = await prisma.transportCompany.create({ data: { name, phone: phone || null } });
    return NextResponse.json(company);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}