import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = searchParams.get('limit');

    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      ...(limit ? { take: parseInt(limit, 10) } : {}),
    });

    return NextResponse.json(logs);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}