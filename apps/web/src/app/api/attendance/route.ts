import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { requireRole } from '../../../lib/rbac';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const employees = await prisma.employee.findMany({
      where: { status: 'Active' },
      include: {
        attendance: month && year ? {
          where: {
            date: {
              gte: new Date(parseInt(year), parseInt(month) - 1, 1),
              lt: new Date(parseInt(year), parseInt(month), 1),
            },
          },
          orderBy: { date: 'asc' },
        } : { orderBy: { date: 'desc' }, take: 31 },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(employees);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const deny = await requireRole(req, 'MANAGER');
  if (deny) return deny;
  try {
    const body = await req.json();
    const { records } = body;
    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'Records array required' }, { status: 400 });
    }

    // Upsert each attendance record
    const results = await Promise.all(
      records.map(async (r: { employeeId: number; date: string; status: string }) => {
        const dateObj = new Date(r.date);
        const existing = await prisma.attendance.findFirst({
          where: { employeeId: r.employeeId, date: dateObj },
        });
        if (existing) {
          return prisma.attendance.update({ where: { id: existing.id }, data: { status: r.status } });
        }
        return prisma.attendance.create({ data: { employeeId: r.employeeId, date: dateObj, status: r.status } });
      })
    );

    return NextResponse.json({ saved: results.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
