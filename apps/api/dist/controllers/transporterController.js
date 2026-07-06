"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransporterPayment = exports.getTransporterTrips = exports.updateTransporter = exports.getTransporters = void 0;
const db_1 = require("@nur-afiq/db");
const getTransporters = async (req, res) => {
    try {
        const companies = await db_1.prisma.transportCompany.findMany({
            include: {
                trips: true,
                payments: true
            }
        });
        const summary = companies.map(c => {
            const totalTrips = c.trips.length;
            const totalAmount = c.trips.reduce((sum, t) => sum + (t.transportTripFee || 0.0), 0.0);
            const paidAmount = c.payments.reduce((sum, p) => sum + p.amountPaid, 0.0);
            const outstandingAmount = totalAmount - paidAmount;
            return {
                id: c.id,
                name: c.name,
                phone: c.phone,
                totalTrips,
                totalAmount,
                paid: paidAmount,
                outstanding: outstandingAmount
            };
        });
        res.json(summary);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getTransporters = getTransporters;
const updateTransporter = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, phone } = req.body;
        const existing = await db_1.prisma.transportCompany.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ error: 'Transporter not found' });
        const updated = await db_1.prisma.transportCompany.update({
            where: { id },
            data: {
                name: name ?? existing.name,
                phone: phone ?? existing.phone
            }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateTransporter = updateTransporter;
const getTransporterTrips = async (req, res) => {
    try {
        const parentId = parseInt(req.params.id);
        const trips = await db_1.prisma.purchase.findMany({
            where: {
                transportCompanyId: parentId
            },
            include: {
                supplier: true
            },
            orderBy: { date: 'desc' }
        });
        res.json(trips);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getTransporterTrips = getTransporterTrips;
const createTransporterPayment = async (req, res) => {
    try {
        const companyId = parseInt(req.params.id);
        const { paymentMethod, amountPaid, tripIds } = req.body;
        const company = await db_1.prisma.transportCompany.findUnique({
            where: { id: companyId }
        });
        if (!company)
            return res.status(404).json({ error: 'Transporter company not found' });
        const floatAmount = parseFloat(amountPaid) || 0.0;
        const result = await db_1.prisma.$transaction(async (tx) => {
            // 1. Create Payment Log
            const paymentLog = await tx.transporterPayment.create({
                data: {
                    transportCompanyId: companyId,
                    paymentMethod,
                    amountPaid: floatAmount,
                    tripsPaid: JSON.stringify(tripIds)
                }
            });
            // 2. Mark selected trips as PAID
            await tx.purchase.updateMany({
                where: {
                    id: { in: tripIds },
                    transportCompanyId: companyId
                },
                data: {
                    transportPaymentStatus: 'PAID'
                }
            });
            // 3. Write outflow into Cash Book
            await tx.cashBook.create({
                data: {
                    type: 'OUT',
                    category: 'TRANSPORT',
                    amount: floatAmount,
                    referenceId: `PAY-${paymentLog.id}`,
                    description: `Disbursement to external towing partner ${company.name} for ${tripIds.length} logistics runs.`
                }
            });
            // 4. Audit logger
            await tx.auditLog.create({
                data: {
                    action: `TRANSPORTER SETTLED: ${company.name}`,
                    performedBy: 'Manager',
                    details: `Settled B$${floatAmount} via ${paymentMethod} for runs: ${tripIds.join(', ')}`
                }
            });
            return paymentLog;
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createTransporterPayment = createTransporterPayment;
