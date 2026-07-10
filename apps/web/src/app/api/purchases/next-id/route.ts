import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const year = new Date().getFullYear();
    const last = await prisma.purchase.findFirst({
      where: { id: { startsWith: `PUR-${year}-` } },
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    const lastNum = last ? parseInt(last.id.split('-')[2]) : 0;
    return NextResponse.json({ id: `PUR-${year}-${(lastNum + 1).toString().padStart(3, '0')}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
