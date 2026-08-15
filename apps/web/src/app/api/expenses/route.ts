import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';
import { withRetry } from '@/lib/retry';

export const GET = withMiddleware(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const expenses = await withRetry(() => prisma.expense.findMany({
    where: from && to ? { date: { gte: new Date(from), lte: new Date(to) } } : undefined,
    select: { id: true, date: true, category: true, description: true, amount: true, paymentMethod: true, paidTo: true, referenceId: true },
    orderBy: { date: 'desc' },
  }));
  return NextResponse.json(expenses);
});

export const POST = withMiddleware(async (req: NextRequest) => {
  try {
    const { date, category, description, amount, paymentMethod, paidTo, referenceId } = await req.json();
    if (!category || !description || !amount) {
      return NextResponse.json({ error: 'Category, description and amount are required' }, { status: 400 });
    }
    const expenseDate = date ? new Date(date) : new Date();
    const parsedAmount = parseFloat(amount);

    const [expense] = await withRetry(() => prisma.$transaction([
      prisma.expense.create({
        data: { date: expenseDate, category, description, amount: parsedAmount, paymentMethod: paymentMethod || 'CASH', paidTo, referenceId },
      }),
      prisma.cashBook.create({
        data: { date: expenseDate, type: 'OUT', category: 'OTHER', amount: parsedAmount, description: `${category}: ${description}`, referenceId: referenceId || undefined },
      }),
      prisma.auditLog.create({
        data: { action: 'RECORDED EXPENSE', performedBy: 'Manager', details: `${category} - B$${amount} to ${paidTo || 'N/A'}` },
      }),
    ]));

    return NextResponse.json(expense, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}, { minRole: 'MANAGER', idempotent: true });
