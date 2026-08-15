import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';
import { withRetry } from '@/lib/retry';

export const GET = withMiddleware(async () => {
  const employees = await withRetry(() => prisma.employee.findMany({
    select: {
      id: true, employeeId: true, name: true, icNumber: true, passportNumber: true,
      country: true, visaExpiry: true, phone: true, position: true, department: true,
      salary: true, bankAccount: true, bankName: true, joinDate: true, status: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  }));
  return NextResponse.json(employees);
}, { minRole: 'MANAGER' });

export const POST = withMiddleware(async (req: NextRequest) => {
  try {
    const { name, icNumber, passportNumber, country, visaExpiry, phone, position, department, salary, bankAccount, bankName, joinDate } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const employee = await withRetry(() => prisma.$transaction(async (tx) => {
      const last = await tx.employee.findFirst({ orderBy: { createdAt: 'desc' }, select: { employeeId: true } });
      const lastNum = last ? parseInt(last.employeeId.split('-')[1]) : 0;
      const employeeId = `EMP-${String(lastNum + 1).padStart(3, '0')}`;
      return tx.employee.create({
        data: { employeeId, name, icNumber, passportNumber, country, visaExpiry: visaExpiry ? new Date(visaExpiry) : null, phone, position, department, salary: parseFloat(salary) || 0, bankAccount, bankName, joinDate: joinDate ? new Date(joinDate) : new Date() },
      });
    }));

    prisma.auditLog.create({
      data: { action: `CREATED EMPLOYEE ${employee.employeeId}`, performedBy: 'Manager', details: `Name: ${name}` },
    }).catch(console.error);

    return NextResponse.json(employee, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}, { minRole: 'MANAGER', idempotent: true });
