"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const db_1 = require("@nur-afiq/db");
const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Total spent today (sum of agreedPrice of purchases today)
        const todayPurchases = await db_1.prisma.purchase.findMany({
            where: {
                date: {
                    gte: today,
                },
            },
        });
        const totalSpentToday = todayPurchases.reduce((sum, p) => sum + p.agreedPrice, 0);
        // Total vehicles acquired today
        const vehiclesAcquired = todayPurchases.filter(p => p.type === 'VEHICLE').length;
        // Alloy wheels acquired today
        const alloyWheelsToday = todayPurchases
            .filter(p => p.type === 'VEHICLE')
            .reduce((sum, p) => sum + (p.alloyWheelsCount || 0), 0);
        // Logistics runs today
        const logisticsRunsToday = todayPurchases.length;
        // Expiry alerts for vehicles
        const vehicles = await db_1.prisma.vehicleInventory.findMany();
        const expiryAlerts = vehicles.map(v => {
            const roadTaxDays = Math.ceil((new Date(v.roadTaxExpiry).getTime() - Date.now()) / (1000 * 3600 * 24));
            const insDays = Math.ceil((new Date(v.insuranceExpiry).getTime() - Date.now()) / (1000 * 3600 * 24));
            const isInspExpired = new Date(v.inspectionExpiry).getTime() < Date.now();
            return {
                id: v.id,
                name: v.name,
                plateNumber: v.plateNumber,
                roadTaxDays,
                insDays,
                isInspExpired,
                status: roadTaxDays <= 30 || insDays <= 15 || isInspExpired ? 'WARNING' : 'OK'
            };
        }).filter(a => a.status === 'WARNING');
        res.json({
            totalSpentToday,
            vehiclesAcquired,
            alloyWheelsToday,
            logisticsRunsToday,
            expiryAlertsCount: expiryAlerts.length,
            expiryAlerts
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getDashboardStats = getDashboardStats;
