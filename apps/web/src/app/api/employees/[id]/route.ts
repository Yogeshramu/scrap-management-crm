import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) },
      include: { attendance: { orderBy: { date: 'desc' } }, salaryRecords: { orderBy: { year: 'desc' } } },
    });
    if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(employee);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { name, icNumber, passportNumber, country, phone, position, department, salary, bankAccount, bankName, status, joinDate } = body;
    const employee = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: { name, icNumber, passportNumber, country, phone, position, department, salary: parseFloat(salary) || 0, bankAccount, bankName, status, joinDate: joinDate ? new Date(joinDate) : undefined },
    });
    return NextResponse.json(employee);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
