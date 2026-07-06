import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const list = await prisma.customer.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(list);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, contact } = await req.json();
    if (!name) return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    const customer = await prisma.customer.create({ data: { name, contact: contact || '' } });
    await prisma.auditLog.create({ data: { action: `ADDED CUSTOMER: ${name}`, performedBy: 'Manager', details: `Created customer card for ${name}` } });
    return NextResponse.json(customer);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
