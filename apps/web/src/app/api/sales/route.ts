import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';
import { withRetry } from '@/lib/retry';

export const GET = withMiddleware(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const list = await withRetry(() => prisma.sale.findMany({
    take: limit,
    select: {
      id: true, date: true, grandTotal: true, paymentStatus: true,
      paymentReceived: true, balanceDue: true,
      customer: { select: { id: true, name: true } },
      products: { select: { id: true, product: true, quantity: true, unit: true, price: true, amount: true } },
    },
    orderBy: { date: 'desc' },
  }));
  return NextResponse.json(list, {
    headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=30' },
  });
});

export const POST = withMiddleware(async (req: NextRequest) => {
  try {
    const { customerId, paymentStatus, paymentReceived, customerBillPhoto, products } = await req.json();

    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(customerId) },
      select: { id: true, name: true },
    });
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    let subtotal = 0;
    const items = products.map((item: any) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.price) || 0;
      const amt = q * p;
      subtotal += amt;
      return { product: item.product, quantity: q, unit: item.unit || 'KG', price: p, amount: amt };
    });

    const grandTotal = subtotal;
    const received = paymentStatus === 'PAID' ? grandTotal : (parseFloat(paymentReceived) || 0);
    const balance = grandTotal - received;

    const result = await withRetry(() => prisma.$transaction(async (tx) => {
      // Use findFirst (same as purchases) to avoid count() race condition
      const currentYear = new Date().getFullYear();
      const last = await tx.sale.findFirst({
        where: { id: { startsWith: `SAL-${currentYear}-` } },
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      const saleId = `SAL-${currentYear}-${((last ? parseInt(last.id.split('-')[2]) : 0) + 1).toString().padStart(3, '0')}`;

      const sale = await tx.sale.create({
        data: { id: saleId, customerId: customer.id, subtotal, grandTotal, paymentStatus, paymentReceived: received, balanceDue: balance, customerBillPhoto: customerBillPhoto || '', products: { create: items } },
        include: { products: true },
      });

      if (received > 0) {
        await tx.cashBook.create({
          data: { type: 'IN', category: 'SALE', amount: received, referenceId: saleId, description: `Sales revenue for invoice ${saleId} (${customer.name})` },
        });
      }
      return sale;
    }));

    prisma.auditLog.create({
      data: { action: `CREATED SALE INVOICE: ${result.id}`, performedBy: 'Manager', details: `Sold to ${customer.name}. Total: B$${grandTotal}. Received: B$${received}.` },
    }).catch(console.error);

    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'MANAGER', idempotent: true });
