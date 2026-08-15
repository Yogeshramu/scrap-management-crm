import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';
import { withRetry } from '@/lib/retry';

export const GET = withMiddleware(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const records = await withRetry(() => prisma.salaryRecord.findMany({
    where: {
      ...(month ? { month: parseInt(month) } : {}),
      ...(year ? { year: parseInt(year) } : {}),
    },
    select: {
      id: true, month: true, year: true, workingDays: true, presentDays: true,
      overtimeHours: true, overtimeRate: true, advances: true, grossSalary: true,
      netSalary: true, status: true,
      employee: { select: { id: true, employeeId: true, name: true, position: true, salary: true } },
    },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  }));
  return NextResponse.json(records);
}, { minRole: 'MANAGER' });

export const POST = withMiddleware(async (req: NextRequest) => {
  try {
    const { employeeId, month, year, workingDays, presentDays, overtimeHours, overtimeRate, advances } = await req.json();

    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
      select: { id: true, name: true, salary: true },
    });
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

    const dailyRate = employee.salary / (workingDays || 26);
    const grossSalary = dailyRate * (presentDays || 0) + (parseFloat(overtimeHours) || 0) * (parseFloat(overtimeRate) || 0);
    const netSalary = Math.max(0, grossSalary - (parseFloat(advances) || 0));
    const data = { workingDays: parseInt(workingDays), presentDays: parseInt(presentDays), overtimeHours: parseFloat(overtimeHours) || 0, overtimeRate: parseFloat(overtimeRate) || 0, advances: parseFloat(advances) || 0, grossSalary, netSalary };

    // Use upsert to avoid the findFirst + create/update pattern
    const record = await withRetry(() => prisma.salaryRecord.upsert({
      where: { employeeId_month_year: { employeeId: parseInt(employeeId), month: parseInt(month), year: parseInt(year) } },
      update: data,
      create: { employeeId: parseInt(employeeId), month: parseInt(month), year: parseInt(year), ...data },
    }));

    return NextResponse.json(record, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}, { minRole: 'MANAGER', idempotent: true });

export const PUT = withMiddleware(async (req: NextRequest) => {
  try {
    const { id, status } = await req.json();
    const record = await withRetry(() => prisma.$transaction(async (tx) => {
      const updated = await tx.salaryRecord.update({
        where: { id: parseInt(id) },
        data: { status },
        include: status === 'PAID' ? { employee: { select: { name: true } } } : undefined,
      });
      if (status === 'PAID') {
        await tx.cashBook.create({
          data: { type: 'OUT', category: 'OTHER', amount: updated.netSalary, description: `Salary payment - ${(updated as any).employee?.name} (${updated.month}/${updated.year})` },
        });
      }
      return updated;
    }));
    return NextResponse.json(record);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}, { minRole: 'MANAGER', idempotent: true });
