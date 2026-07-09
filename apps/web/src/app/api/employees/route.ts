import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(employees);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, icNumber, phone, position, department, salary, bankAccount, bankName, joinDate } = body;
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const count = await prisma.employee.count();
    const employeeId = `EMP-${String(count + 1).padStart(3, '0')}`;

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        name,
        icNumber,
        phone,
        position,
        department,
        salary: parseFloat(salary) || 0,
        bankAccount,
        bankName,
        joinDate: joinDate ? new Date(joinDate) : new Date(),
      },
    });

    await prisma.auditLog.create({
      data: { action: `CREATED EMPLOYEE ${employeeId}`, performedBy: 'Manager', details: `Name: ${name}` },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
