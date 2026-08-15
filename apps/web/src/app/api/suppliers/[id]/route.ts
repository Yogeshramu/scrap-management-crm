import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';

export const GET = withMiddleware(async (req: NextRequest) => {
  try {
    const id = parseInt(req.nextUrl.pathname.split('/').at(-1)!);
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: { purchases: { orderBy: { date: 'desc' }, select: { id: true, type: true, date: true, agreedPrice: true, paymentStatus: true, collectionDate: true } } },
    });
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    return NextResponse.json(supplier);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'STAFF' });

export const PUT = withMiddleware(async (req: NextRequest) => {
  try {
    const id = parseInt(req.nextUrl.pathname.split('/').at(-1)!);
    const { name, contact, iceNumber, outstandingAdvance, bankName, bankAccount, documents } = await req.json();
    const existing = await prisma.supplier.findUnique({ where: { id }, select: { id: true, name: true, contact: true, iceNumber: true, outstandingAdvance: true, bankName: true, bankAccount: true, documents: true } });
    if (!existing) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        contact: contact ?? existing.contact,
        iceNumber: iceNumber !== undefined ? iceNumber : existing.iceNumber,
        outstandingAdvance: outstandingAdvance !== undefined ? parseFloat(outstandingAdvance) : existing.outstandingAdvance,
        bankName: bankName !== undefined ? bankName : existing.bankName,
        bankAccount: bankAccount !== undefined ? bankAccount : existing.bankAccount,
        documents: documents !== undefined ? documents : existing.documents,
      },
    });
    await prisma.auditLog.create({ data: { action: `UPDATED SUPPLIER: ${updated.name}`, performedBy: 'Manager', details: `Edited supplier ${updated.name}` } });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'MANAGER', idempotent: true });
