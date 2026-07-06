import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const companyId = parseInt(id);
    const { paymentMethod, amountPaid, tripIds } = await req.json();

    const company = await prisma.transportCompany.findUnique({ where: { id: companyId } });
    if (!company) return NextResponse.json({ error: 'Transporter company not found' }, { status: 404 });

    const floatAmount = parseFloat(amountPaid) || 0;

    const result = await prisma.$transaction(async (tx) => {
      const paymentLog = await tx.transporterPayment.create({
        data: {
          transportCompanyId: companyId,
          paymentMethod,
          amountPaid: floatAmount,
          tripsPaid: JSON.stringify(tripIds),
        },
      });

      await tx.purchase.updateMany({
        where: {
          id: { in: tripIds },
          transportCompanyId: companyId,
        },
        data: {
          transportPaymentStatus: 'PAID',
        },
      });

      await tx.cashBook.create({
        data: {
          type: 'OUT',
          category: 'TRANSPORT',
          amount: floatAmount,
          referenceId: `PAY-${paymentLog.id}`,
          description: `Disbursement to external towing partner ${company.name} for ${tripIds.length} logistics runs.`,
        },
      });

      await tx.auditLog.create({
        data: {
          action: `TRANSPORTER SETTLED: ${company.name}`,
          performedBy: 'Manager',
          details: `Settled B$${floatAmount} via ${paymentMethod} for runs: ${tripIds.join(', ')}`,
        },
      });

      return paymentLog;
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}