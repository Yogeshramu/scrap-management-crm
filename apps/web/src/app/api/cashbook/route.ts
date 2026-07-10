import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = searchParams.get('limit');

    const records = await prisma.cashBook.findMany({
      orderBy: { date: 'desc' },
      take: Math.min(parseInt(limit || '50', 10), 100),
      select: { id: true, date: true, type: true, category: true, amount: true, referenceId: true, description: true },
    });

    return NextResponse.json(records);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}