import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRetry } from '@/lib/retry';

const MS_PER_DAY = 86400000;

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayPurchases, vehicles, todaySales, todayExpenses, activeEmployeesCount] = await withRetry(() =>
      Promise.all([
        prisma.purchase.findMany({ where: { date: { gte: today } } }),
        prisma.vehicleInventory.findMany(),
        prisma.sale.findMany({ where: { date: { gte: today } } }),
        prisma.expense.findMany({ where: { date: { gte: today } } }),
        prisma.employee.count({ where: { status: 'Active' } }),
      ])
    );

    const totalSpentToday = todayPurchases.reduce((sum: number, p) => sum + p.agreedPrice, 0);
    const vehiclesAcquired = todayPurchases.filter(p => p.type === 'VEHICLE').length;
    const alloyWheelsToday = todayPurchases.reduce((sum: number, p) => sum + (p.alloyWheelsCount || 0), 0);
    const logisticsRunsToday = todayPurchases.filter(p => p.type === 'LOGISTICS').length;
    const totalSalesRevenueToday = todaySales.reduce((sum: number, s) => sum + s.grandTotal, 0);
    const invoicesToday = todaySales.length;
    const totalExpensesToday = todayExpenses.reduce((sum: number, e) => sum + e.amount, 0);

    const now = Date.now();
    const expiryAlerts = vehicles
      .filter(v => v.roadTaxExpiry && v.insuranceExpiry && v.inspectionExpiry)
      .map(v => ({
        id: v.id,
        name: v.name,
        plateNumber: v.plateNumber,
        roadTaxDays: Math.ceil((new Date(v.roadTaxExpiry).getTime() - now) / MS_PER_DAY),
        insDays: Math.ceil((new Date(v.insuranceExpiry).getTime() - now) / MS_PER_DAY),
        isInspExpired: new Date(v.inspectionExpiry).getTime() < now,
      }))
      .filter(a => a.roadTaxDays <= 30 || a.insDays <= 15 || a.isInspExpired);

    return NextResponse.json({
      totalSpentToday,
      vehiclesAcquired,
      alloyWheelsToday,
      logisticsRunsToday,
      expiryAlertsCount: expiryAlerts.length,
      expiryAlerts,
      totalSalesRevenueToday,
      invoicesToday,
      totalExpensesToday,
      activeEmployeesCount,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal server error';
    console.error('Error in /api/dashboard/route.ts:', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}