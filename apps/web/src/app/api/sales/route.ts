import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function generateNextSaleId() {
  const currentYear = new Date().getFullYear();
  const count = await prisma.sale.count();
  const nextNum = (count + 1).toString().padStart(3, '0');
  return `SAL-${currentYear}-${nextNum}`;
}

export async function GET() {
  try {
    const list = await prisma.sale.findMany({
      include: { customer: true, products: true },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(list);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { customerId, paymentStatus, paymentReceived, customerBillPhoto, products } = await req.json();
    const customer = await prisma.customer.findUnique({ where: { id: parseInt(customerId) } });
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
    const saleId = await generateNextSaleId();

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: { id: saleId, customerId: customer.id, subtotal, grandTotal, paymentStatus, paymentReceived: received, balanceDue: balance, customerBillPhoto: customerBillPhoto || '', products: { create: items } },
        include: { products: true }
      });
      if (received > 0) {
        await tx.cashBook.create({ data: { type: 'IN', category: 'SALE', amount: received, referenceId: saleId, description: `Sales revenue for invoice ${saleId} (${customer.name})` } });
      }
      await tx.auditLog.create({ data: { action: `CREATED SALE INVOICE: ${saleId}`, performedBy: 'Manager', details: `Sold to ${customer.name}. Total: B$${grandTotal}. Received: B$${received}.` } });
      return sale;
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
