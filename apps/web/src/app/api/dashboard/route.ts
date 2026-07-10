import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/retry';

const MS_PER_DAY = 86400000;

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = Date.now();
    const thirtyDaysOut = new Date(now + 30 * MS_PER_DAY);
    const fifteenDaysOut = new Date(now + 15 * MS_PER_DAY);

    const [
      purchaseAgg,
      vehicleAgg,
      saleAgg,
      expenseAgg,
      activeEmployeesCount,
      expiringVehicles,
    ] = await withRetry(() =>
      Promise.all([
        prisma.purchase.groupBy({
          by: ['type'],
          where: { date: { gte: today } },
          _sum: { agreedPrice: true, alloyWheelsCount: true },
          _count: { id: true },
        }),
        prisma.purchase.count({ where: { date: { gte: today }, type: 'LOGISTICS' } }),
        prisma.sale.aggregate({
          where: { date: { gte: today } },
          _sum: { grandTotal: true },
          _count: { id: true },
        }),
        prisma.expense.aggregate({
          where: { date: { gte: today } },
          _sum: { amount: true },
        }),
        prisma.employee.count({ where: { status: 'Active' } }),
        prisma.vehicleInventory.findMany({
          where: {
            OR: [
              { roadTaxExpiry: { lte: thirtyDaysOut } },
              { insuranceExpiry: { lte: fifteenDaysOut } },
              { inspectionExpiry: { lte: new Date(now) } },
            ],
          },
          select: { id: true, name: true, plateNumber: true, roadTaxExpiry: true, insuranceExpiry: true, inspectionExpiry: true },
        }),
      ])
    );

    const totalSpentToday = purchaseAgg.reduce((s, r) => s + (r._sum.agreedPrice ?? 0), 0);
    const vehiclesAcquired = purchaseAgg.find(r => r.type === 'VEHICLE')?._count.id ?? 0;
    const alloyWheelsToday = purchaseAgg.reduce((s, r) => s + (r._sum.alloyWheelsCount ?? 0), 0);
    const logisticsRunsToday = vehicleAgg;
    const totalSalesRevenueToday = saleAgg._sum.grandTotal ?? 0;
    const invoicesToday = saleAgg._count.id;
    const totalExpensesToday = expenseAgg._sum.amount ?? 0;

    const expiryAlerts = expiringVehicles.map(v => ({
      id: v.id,
      name: v.name,
      plateNumber: v.plateNumber,
      roadTaxDays: Math.ceil((new Date(v.roadTaxExpiry).getTime() - now) / MS_PER_DAY),
      insDays: Math.ceil((new Date(v.insuranceExpiry).getTime() - now) / MS_PER_DAY),
      isInspExpired: new Date(v.inspectionExpiry).getTime() < now,
    }));

    return NextResponse.json({
      totalSpentToday, vehiclesAcquired, alloyWheelsToday, logisticsRunsToday,
      expiryAlertsCount: expiryAlerts.length, expiryAlerts,
      totalSalesRevenueToday, invoicesToday, totalExpensesToday, activeEmployeesCount,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    console.error('Error in /api/dashboard/route.ts:', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}