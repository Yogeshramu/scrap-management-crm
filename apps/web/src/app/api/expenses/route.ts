import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const expenses = await prisma.expense.findMany({
      where: {
        ...(from && to ? { date: { gte: new Date(from), lte: new Date(to) } } : {}),
      },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(expenses);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, category, description, amount, paymentMethod, paidTo, referenceId } = body;
    if (!category || !description || !amount) {
      return NextResponse.json({ error: 'Category, description and amount are required' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        date: date ? new Date(date) : new Date(),
        category,
        description,
        amount: parseFloat(amount),
        paymentMethod: paymentMethod || 'CASH',
        paidTo,
        referenceId,
      },
    });

    await prisma.cashBook.create({
      data: {
        date: expense.date,
        type: 'OUT',
        category: 'OTHER',
        amount: expense.amount,
        description: `${category}: ${description}`,
        referenceId: referenceId || undefined,
      },
    });

    await prisma.auditLog.create({
      data: { action: `RECORDED EXPENSE`, performedBy: 'Manager', details: `${category} - B$${amount} to ${paidTo || 'N/A'}` },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
