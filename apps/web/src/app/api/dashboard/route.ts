import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';
import { withRetry } from '@/lib/retry';

const MS_PER_DAY = 86400000;

export const GET = withMiddleware(async (_req: NextRequest) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = Date.now();
    const thirtyDaysOut = new Date(now + 30 * MS_PER_DAY);
    const fifteenDaysOut = new Date(now + 15 * MS_PER_DAY);

    const [purchaseAgg, vehicleAgg, saleAgg, expenseAgg, activeEmployeesCount, expiringVehicles] = await withRetry(() =>
      Promise.all([
        prisma.purchase.groupBy({ by: ['type'], where: { date: { gte: today } }, _sum: { agreedPrice: true, alloyWheelsCount: true }, _count: { id: true } }),
        prisma.purchase.count({ where: { date: { gte: today }, type: 'LOGISTICS' } }),
        prisma.sale.aggregate({ where: { date: { gte: today } }, _sum: { grandTotal: true }, _count: { id: true } }),
        prisma.expense.aggregate({ where: { date: { gte: today } }, _sum: { amount: true } }),
        prisma.employee.count({ where: { status: 'Active' } }),
        prisma.vehicleInventory.findMany({
          where: { OR: [{ roadTaxExpiry: { lte: thirtyDaysOut } }, { insuranceExpiry: { lte: fifteenDaysOut } }, { inspectionExpiry: { lte: new Date(now) } }] },
          select: { id: true, name: true, plateNumber: true, roadTaxExpiry: true, insuranceExpiry: true, inspectionExpiry: true },
        }),
      ])
    );

    const expiryAlerts = expiringVehicles.map(v => ({
      id: v.id, name: v.name, plateNumber: v.plateNumber,
      roadTaxDays: Math.ceil((new Date(v.roadTaxExpiry).getTime() - now) / MS_PER_DAY),
      insDays: Math.ceil((new Date(v.insuranceExpiry).getTime() - now) / MS_PER_DAY),
      isInspExpired: new Date(v.inspectionExpiry).getTime() < now,
    }));

    return NextResponse.json({
      totalSpentToday: purchaseAgg.reduce((s, r) => s + (r._sum.agreedPrice ?? 0), 0),
      vehiclesAcquired: purchaseAgg.find(r => r.type === 'VEHICLE')?._count.id ?? 0,
      alloyWheelsToday: purchaseAgg.reduce((s, r) => s + (r._sum.alloyWheelsCount ?? 0), 0),
      logisticsRunsToday: vehicleAgg,
      totalSalesRevenueToday: saleAgg._sum.grandTotal ?? 0,
      invoicesToday: saleAgg._count.id,
      totalExpensesToday: expenseAgg._sum.amount ?? 0,
      activeEmployeesCount,
      expiryAlertsCount: expiryAlerts.length,
      expiryAlerts,
    }, { headers: { 'Cache-Control': 'public, max-age=10, stale-while-revalidate=30' } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'STAFF' });
