import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { paymentStatus, paymentReceived } = await req.json();
    const existing = await prisma.sale.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Sale not found' }, { status: 404 });

    const received = paymentStatus === 'PAID' ? existing.grandTotal : (parseFloat(paymentReceived) || existing.paymentReceived);
    const balance = existing.grandTotal - received;

    const updated = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.update({
        where: { id },
        data: { paymentStatus: paymentStatus ?? existing.paymentStatus, paymentReceived: received, balanceDue: balance },
        include: { customer: true, products: true }
      });
      await tx.auditLog.create({ data: { action: `UPDATED SALE: ${id}`, performedBy: 'Manager', details: `Edited sale ${id}. Status: ${paymentStatus}, Received: B$${received}.` } });
      return sale;
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
