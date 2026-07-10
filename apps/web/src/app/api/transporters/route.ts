import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const companies = await prisma.transportCompany.findMany({
      select: {
        id: true, name: true, phone: true,
        trips: {
          where: { transportTripFee: { not: null } },
          select: { transportTripFee: true, transportPaymentStatus: true },
        },
      },
    });

    const summary = companies.map((company) => {
      const totalTrips = company.trips.length;
      const totalAmount = company.trips.reduce((s, t) => s + (t.transportTripFee ?? 0), 0);
      const paid = company.trips.filter(t => t.transportPaymentStatus === 'PAID').reduce((s, t) => s + (t.transportTripFee ?? 0), 0);
      return { id: company.id, name: company.name, phone: company.phone, totalTrips, totalAmount, paid, outstanding: totalAmount - paid };
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