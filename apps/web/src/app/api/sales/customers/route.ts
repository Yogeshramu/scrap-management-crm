import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';
import { withRetry } from '@/lib/retry';

export const GET = withMiddleware(async () => {
  const list = await withRetry(() => prisma.customer.findMany({
    select: { id: true, name: true, contact: true },
    orderBy: { name: 'asc' },
  }));
  return NextResponse.json(list, {
    headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' },
  });
});

export const POST = withMiddleware(async (req: NextRequest) => {
  try {
    const { name, contact } = await req.json();
    if (!name) return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    const customer = await withRetry(() => prisma.customer.create({ data: { name, contact: contact || '' } }));
    prisma.auditLog.create({
      data: { action: `ADDED CUSTOMER: ${name}`, performedBy: 'Manager', details: `Created customer card for ${name}` },
    }).catch(console.error);
    return NextResponse.json(customer, { status: 201 });
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Customer with this name already exists.' }, { status: 409 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'MANAGER', idempotent: true });
