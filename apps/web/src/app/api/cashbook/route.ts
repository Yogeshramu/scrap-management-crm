import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';

export const GET = withMiddleware(async (req: NextRequest) => {
  try {
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50', 10), 100);
    const records = await prisma.cashBook.findMany({
      orderBy: { date: 'desc' },
      take: limit,
      select: { id: true, date: true, type: true, category: true, amount: true, referenceId: true, description: true },
    });
    return NextResponse.json(records);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'STAFF' });
