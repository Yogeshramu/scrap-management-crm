import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';
import { withRetry } from '@/lib/retry';

export const GET = withMiddleware(async () => {
  const [companies, tripAgg] = await withRetry(() => Promise.all([
    prisma.transportCompany.findMany({
      select: { id: true, name: true, phone: true },
      orderBy: { name: 'asc' },
    }),
    prisma.purchase.groupBy({
      by: ['transportCompanyId', 'transportPaymentStatus'],
      where: { transportCompanyId: { not: null }, transportTripFee: { not: null } },
      _sum: { transportTripFee: true },
      _count: { id: true },
    }),
  ]));

  const summary = companies.map((company) => {
    const rows = tripAgg.filter(r => r.transportCompanyId === company.id);
    const totalTrips = rows.reduce((s, r) => s + r._count.id, 0);
    const totalAmount = rows.reduce((s, r) => s + (r._sum.transportTripFee ?? 0), 0);
    const paid = rows.filter(r => r.transportPaymentStatus === 'PAID').reduce((s, r) => s + (r._sum.transportTripFee ?? 0), 0);
    return { id: company.id, name: company.name, phone: company.phone, totalTrips, totalAmount, paid, outstanding: totalAmount - paid };
  });

  return NextResponse.json(summary, {
    headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' },
  });
});

export const POST = withMiddleware(async (req: NextRequest) => {
  try {
    const { name, phone } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    const company = await withRetry(() => prisma.transportCompany.create({ data: { name, phone: phone || null } }));
    return NextResponse.json(company, { status: 201 });
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Transporter with this name already exists.' }, { status: 409 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'MANAGER', idempotent: true });
