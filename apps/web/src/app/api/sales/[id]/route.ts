import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';

export const PUT = withMiddleware(async (req: NextRequest) => {
  try {
    const id = req.nextUrl.pathname.split('/').at(-1)!;
    const { paymentStatus, paymentReceived } = await req.json();
    const existing = await prisma.sale.findUnique({ where: { id }, select: { id: true, grandTotal: true, paymentStatus: true, paymentReceived: true } });
    if (!existing) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });

    const received = paymentStatus === 'PAID' ? existing.grandTotal : (parseFloat(paymentReceived) || existing.paymentReceived);
    const updated = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.update({
        where: { id },
        data: { paymentStatus: paymentStatus ?? existing.paymentStatus, paymentReceived: received, balanceDue: existing.grandTotal - received },
        include: { customer: true, products: true },
      });
      await tx.auditLog.create({ data: { action: `UPDATED SALE: ${id}`, performedBy: 'Manager', details: `Status: ${paymentStatus}, Received: ${received}` } });
      return sale;
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'MANAGER', idempotent: true });
