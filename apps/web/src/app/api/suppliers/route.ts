import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';
import { withRetry } from '@/lib/retry';

export const GET = withMiddleware(async () => {
  const list = await withRetry(() => prisma.supplier.findMany({
    select: { id: true, name: true, contact: true, iceNumber: true, outstandingAdvance: true, bankName: true, bankAccount: true },
    orderBy: { name: 'asc' },
  }));
  return NextResponse.json(list, {
    headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' },
  });
});

export const POST = withMiddleware(async (req: NextRequest) => {
  try {
    const { name, contact, iceNumber, outstandingAdvance, bankName, bankAccount, documents } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    const supplier = await withRetry(() => prisma.supplier.create({
      data: { name, contact: contact || '', iceNumber: iceNumber || null, outstandingAdvance: parseFloat(outstandingAdvance) || 0, bankName: bankName || null, bankAccount: bankAccount || null, documents: documents || null },
    }));
    prisma.auditLog.create({
      data: { action: `ADDED SUPPLIER: ${name}`, performedBy: 'Manager', details: `Outstanding advance: B$${outstandingAdvance || 0}` },
    }).catch(console.error);
    return NextResponse.json(supplier, { status: 201 });
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'A supplier with this name already exists.' }, { status: 409 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'MANAGER', idempotent: true });
