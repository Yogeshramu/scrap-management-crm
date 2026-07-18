import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const list = await prisma.supplier.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(list);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, contact, iceNumber, outstandingAdvance, bankName, bankAccount, documents } = await req.json();
    const supplier = await prisma.supplier.create({
      data: { name, contact: contact || '', iceNumber: iceNumber || null, outstandingAdvance: parseFloat(outstandingAdvance) || 0, bankName: bankName || null, bankAccount: bankAccount || null, documents: documents || null }
    });
    await prisma.auditLog.create({
      data: { action: `ADDED SUPPLIER: ${name}`, performedBy: 'Manager', details: `Created supplier card with outstanding advance of B$${outstandingAdvance || 0}` }
    });
    return NextResponse.json(supplier);
  } catch (e: any) {
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'A supplier with this name already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
