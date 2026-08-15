import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';

export const GET = withMiddleware(async (req: NextRequest) => {
  try {
    const id = parseInt(req.nextUrl.pathname.split('/').at(-1)!);
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        attendance: { orderBy: { date: 'desc' }, select: { id: true, date: true, status: true } },
        salaryRecords: { orderBy: { year: 'desc' }, select: { id: true, month: true, year: true, grossSalary: true, netSalary: true, status: true } },
      },
    });
    if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(employee);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'STAFF' });

export const PUT = withMiddleware(async (req: NextRequest) => {
  try {
    const id = parseInt(req.nextUrl.pathname.split('/').at(-1)!);
    const { name, icNumber, passportNumber, country, visaExpiry, phone, position, department, salary, bankAccount, bankName, status, joinDate } = await req.json();
    const employee = await prisma.employee.update({
      where: { id },
      data: { name, icNumber, passportNumber, country, visaExpiry: visaExpiry ? new Date(visaExpiry) : null, phone, position, department, salary: parseFloat(salary) || 0, bankAccount, bankName, status, joinDate: joinDate ? new Date(joinDate) : undefined },
      select: { id: true, name: true, position: true, department: true, salary: true, status: true },
    });
    return NextResponse.json(employee);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'MANAGER', idempotent: true });
