import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';
import { withRetry } from '@/lib/retry';

export const GET = withMiddleware(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const employees = await withRetry(() => prisma.employee.findMany({
    where: { status: 'Active' },
    select: {
      id: true, employeeId: true, name: true, position: true, department: true,
      attendance: month && year ? {
        where: {
          date: {
            gte: new Date(parseInt(year), parseInt(month) - 1, 1),
            lt: new Date(parseInt(year), parseInt(month), 1),
          },
        },
        select: { id: true, date: true, status: true },
        orderBy: { date: 'asc' },
      } : {
        select: { id: true, date: true, status: true },
        orderBy: { date: 'desc' },
        take: 31,
      },
    },
    orderBy: { name: 'asc' },
  }));
  return NextResponse.json(employees);
});

export const POST = withMiddleware(async (req: NextRequest) => {
  try {
    const { records } = await req.json();
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'Records array required' }, { status: 400 });
    }
    const results = await withRetry(() => prisma.$transaction(
      records.map((r: { employeeId: number; date: string; status: string }) =>
        prisma.attendance.upsert({
          where: { employeeId_date: { employeeId: r.employeeId, date: new Date(r.date) } },
          update: { status: r.status },
          create: { employeeId: r.employeeId, date: new Date(r.date), status: r.status },
        })
      )
    ));
    return NextResponse.json({ saved: results.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}, { minRole: 'MANAGER', idempotent: true });
