import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPurchases = await prisma.purchase.findMany({
      where: {
        date: {
          gte: today,
        },
      },
    });

    const totalSpentToday = todayPurchases.reduce((sum: number, purchase) => sum + purchase.agreedPrice, 0);
    const vehiclesAcquired = todayPurchases.filter((purchase) => purchase.type === 'VEHICLE').length;
    const alloyWheelsToday = todayPurchases
      .filter((purchase) => purchase.type === 'VEHICLE')
      .reduce((sum: number, purchase) => sum + (purchase.alloyWheelsCount || 0), 0);
    const logisticsRunsToday = todayPurchases.length;

    const vehicles = await prisma.vehicleInventory.findMany();
    const expiryAlerts = vehicles
      .map((vehicle) => {
        const roadTaxDays = Math.ceil((new Date(vehicle.roadTaxExpiry).getTime() - Date.now()) / (1000 * 3600 * 24));
        const insDays = Math.ceil((new Date(vehicle.insuranceExpiry).getTime() - Date.now()) / (1000 * 3600 * 24));
        const isInspExpired = new Date(vehicle.inspectionExpiry).getTime() < Date.now();

        return {
          id: vehicle.id,
          name: vehicle.name,
          plateNumber: vehicle.plateNumber,
          roadTaxDays,
          insDays,
          isInspExpired,
          status: roadTaxDays <= 30 || insDays <= 15 || isInspExpired ? 'WARNING' : 'OK',
        };
      })
      .filter((alert) => alert.status === 'WARNING');

    // New additions: Sales, Expenses, Employees
    const todaySales = await prisma.sale.findMany({
      where: {
        date: {
          gte: today,
        },
      },
    });
    const totalSalesRevenueToday = todaySales.reduce((sum: number, sale) => sum + sale.grandTotal, 0);
    const invoicesToday = todaySales.length;

    const todayExpenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: today,
        },
      },
    });
    const totalExpensesToday = todayExpenses.reduce((sum: number, expense) => sum + expense.amount, 0);

    const activeEmployeesCount = await prisma.employee.count({
      where: {
        status: 'Active',
      },
    });

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
  } catch (e: any) {
    console.error("Error in /api/dashboard/route.ts:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}