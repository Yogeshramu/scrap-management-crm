"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addVehicleFuel = exports.addVehicleMaintenance = exports.updateVehicle = exports.createVehicle = exports.getVehicles = void 0;
const db_1 = require("@nur-afiq/db");
const getVehicles = async (req, res) => {
    try {
        const list = await db_1.prisma.vehicleInventory.findMany({
            include: {
                maintenanceLogs: true,
                fuelLogs: true
            },
            orderBy: { name: 'asc' }
        });
        res.json(list);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getVehicles = getVehicles;
const createVehicle = async (req, res) => {
    try {
        const { name, type, plateNumber, brand, model, year, roadTaxExpiry, insuranceExpiry, inspectionExpiry, roadTaxPdf, insurancePdf, registrationCardPdf, inspectionPdf } = req.body;
        const newVehicle = await db_1.prisma.vehicleInventory.create({
            data: {
                name,
                type,
                plateNumber,
                brand,
                model,
                year: parseInt(year) || new Date().getFullYear(),
                roadTaxExpiry: new Date(roadTaxExpiry),
                insuranceExpiry: new Date(insuranceExpiry),
                inspectionExpiry: new Date(inspectionExpiry || Date.now()),
                status: 'Active',
                roadTaxPdf: roadTaxPdf || '',
                insurancePdf: insurancePdf || '',
                registrationCardPdf: registrationCardPdf || '',
                inspectionPdf: inspectionPdf || ''
            }
        });
        await db_1.prisma.auditLog.create({
            data: {
                action: `ADDED VEHICLE: ${name} [${plateNumber}]`,
                performedBy: 'Manager',
                details: `Registered company asset ${brand} ${model} to fleet management lists.`
            }
        });
        res.json(newVehicle);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createVehicle = createVehicle;
const updateVehicle = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, type, brand, model, year, roadTaxExpiry, insuranceExpiry, inspectionExpiry, status } = req.body;
        const existing = await db_1.prisma.vehicleInventory.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ error: 'Vehicle not found' });
        const updated = await db_1.prisma.vehicleInventory.update({
            where: { id },
            data: {
                name: name ?? existing.name,
                type: type ?? existing.type,
                brand: brand ?? existing.brand,
                model: model ?? existing.model,
                year: year !== undefined ? parseInt(year) : existing.year,
                roadTaxExpiry: roadTaxExpiry ? new Date(roadTaxExpiry) : existing.roadTaxExpiry,
                insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : existing.insuranceExpiry,
                inspectionExpiry: inspectionExpiry ? new Date(inspectionExpiry) : existing.inspectionExpiry,
                status: status ?? existing.status
            },
            include: { maintenanceLogs: true, fuelLogs: true }
        });
        await db_1.prisma.auditLog.create({
            data: {
                action: `UPDATED VEHICLE: ${updated.name} [${updated.plateNumber}]`,
                performedBy: 'Manager',
                details: `Edited fleet asset ${updated.name}. Road tax: ${updated.roadTaxExpiry.toISOString().split('T')[0]}.`
            }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateVehicle = updateVehicle;
const addVehicleMaintenance = async (req, res) => {
    try {
        const vehicleId = parseInt(req.params.id);
        const { date, service, cost, workshop } = req.body;
        const maintenance = await db_1.prisma.vehicleMaintenance.create({
            data: {
                vehicleId,
                date: new Date(date),
                service,
                cost: parseFloat(cost) || 0.0,
                workshop: workshop || ''
            }
        });
        // Also deduct maintenance cost dynamically from CashBook under TRANSPORT category
        await db_1.prisma.cashBook.create({
            data: {
                type: 'OUT',
                category: 'TRANSPORT',
                amount: parseFloat(cost) || 0.0,
                referenceId: `MAINT-${maintenance.id}`,
                description: `Vehicle Maintenance: ${service} on vehicle ID ${vehicleId}`
            }
        });
        res.json(maintenance);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.addVehicleMaintenance = addVehicleMaintenance;
const addVehicleFuel = async (req, res) => {
    try {
        const vehicleId = parseInt(req.params.id);
        const { date, amount, cost, odometer } = req.body;
        const fuel = await db_1.prisma.vehicleFuel.create({
            data: {
                vehicleId,
                date: new Date(date),
                amount: parseFloat(amount) || 0.0,
                cost: parseFloat(cost) || 0.0,
                odometer: odometer ? parseFloat(odometer) : null
            }
        });
        // Write fuel cost outflow to CashBook under TRANSPORT category
        await db_1.prisma.cashBook.create({
            data: {
                type: 'OUT',
                category: 'TRANSPORT',
                amount: parseFloat(cost) || 0.0,
                referenceId: `FUEL-${fuel.id}`,
                description: `Fuel purchase: ${amount} liters on vehicle ID ${vehicleId}`
            }
        });
        res.json(fuel);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.addVehicleFuel = addVehicleFuel;
