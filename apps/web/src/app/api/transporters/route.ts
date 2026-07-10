import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [companies, allTrips] = await Promise.all([
      prisma.transportCompany.findMany({ select: { id: true, name: true, phone: true } }),
      prisma.purchase.groupBy({
        by: ['transportCompanyId', 'transportPaymentStatus'],
        where: { transportCompanyId: { not: null }, transportTripFee: { not: null } },
        _sum: { transportTripFee: true },
        _count: { id: true },
      }),
    ]);

    const summary = companies.map((company) => {
      const rows = allTrips.filter(r => r.transportCompanyId === company.id);
      const totalTrips = rows.reduce((s, r) => s + r._count.id, 0);
      const totalAmount = rows.reduce((s, r) => s + (r._sum.transportTripFee ?? 0), 0);
      const paid = rows.filter(r => r.transportPaymentStatus === 'PAID').reduce((s, r) => s + (r._sum.transportTripFee ?? 0), 0);
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