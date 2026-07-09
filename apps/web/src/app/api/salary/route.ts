import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const records = await prisma.salaryRecord.findMany({
      where: {
        ...(month ? { month: parseInt(month) } : {}),
        ...(year ? { year: parseInt(year) } : {}),
      },
      include: { employee: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return NextResponse.json(records);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, month, year, workingDays, presentDays, overtimeHours, overtimeRate, advances } = body;

    const employee = await prisma.employee.findUnique({ where: { id: parseInt(employeeId) } });
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

    const dailyRate = employee.salary / (workingDays || 26);
    const grossSalary = dailyRate * (presentDays || 0) + (parseFloat(overtimeHours) || 0) * (parseFloat(overtimeRate) || 0);
    const netSalary = Math.max(0, grossSalary - (parseFloat(advances) || 0));

    const existing = await prisma.salaryRecord.findFirst({
      where: { employeeId: parseInt(employeeId), month: parseInt(month), year: parseInt(year) },
    });

    let record;
    if (existing) {
      record = await prisma.salaryRecord.update({
        where: { id: existing.id },
        data: { workingDays: parseInt(workingDays), presentDays: parseInt(presentDays), overtimeHours: parseFloat(overtimeHours) || 0, overtimeRate: parseFloat(overtimeRate) || 0, advances: parseFloat(advances) || 0, grossSalary, netSalary },
      });
    } else {
      record = await prisma.salaryRecord.create({
        data: { employeeId: parseInt(employeeId), month: parseInt(month), year: parseInt(year), workingDays: parseInt(workingDays), presentDays: parseInt(presentDays), overtimeHours: parseFloat(overtimeHours) || 0, overtimeRate: parseFloat(overtimeRate) || 0, advances: parseFloat(advances) || 0, grossSalary, netSalary },
      });
    }

    return NextResponse.json(record, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;
    const record = await prisma.salaryRecord.update({ where: { id: parseInt(id) }, data: { status } });

    if (status === 'PAID') {
      const emp = await prisma.employee.findUnique({ where: { id: record.employeeId } });
      await prisma.cashBook.create({
        data: { type: 'OUT', category: 'OTHER', amount: record.netSalary, description: `Salary payment - ${emp?.name} (${record.month}/${record.year})` },
      });
    }

    return NextResponse.json(record);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
