import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(id) },
      include: {
        purchases: { orderBy: { date: 'desc' }, select: { id: true, type: true, date: true, agreedPrice: true, paymentStatus: true, collectionDate: true } }
      }
    });
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    return NextResponse.json(supplier);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, contact, iceNumber, outstandingAdvance, bankName, bankAccount, documents } = await req.json();
    const existing = await prisma.supplier.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    const updated = await prisma.supplier.update({
      where: { id: parseInt(id) },
      data: {
        name: name ?? existing.name,
        contact: contact ?? existing.contact,
        iceNumber: iceNumber !== undefined ? iceNumber : existing.iceNumber,
        outstandingAdvance: outstandingAdvance !== undefined ? parseFloat(outstandingAdvance) : existing.outstandingAdvance,
        bankName: bankName !== undefined ? bankName : existing.bankName,
        bankAccount: bankAccount !== undefined ? bankAccount : existing.bankAccount,
        documents: documents !== undefined ? documents : existing.documents,
      }
    });
    await prisma.auditLog.create({
      data: { action: `UPDATED SUPPLIER: ${updated.name}`, performedBy: 'Manager', details: `Edited supplier card for ${updated.name}.` }
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
