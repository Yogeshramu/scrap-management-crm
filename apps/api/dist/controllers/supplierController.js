"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSupplier = exports.updateSupplier = exports.getSuppliers = void 0;
const db_1 = require("@nur-afiq/db");
const getSuppliers = async (req, res) => {
    try {
        const list = await db_1.prisma.supplier.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(list);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getSuppliers = getSuppliers;
const updateSupplier = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, contact, outstandingAdvance } = req.body;
        const existing = await db_1.prisma.supplier.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ error: 'Supplier not found' });
        const updated = await db_1.prisma.supplier.update({
            where: { id },
            data: {
                name: name ?? existing.name,
                contact: contact ?? existing.contact,
                outstandingAdvance: outstandingAdvance !== undefined ? parseFloat(outstandingAdvance) : existing.outstandingAdvance
            }
        });
        await db_1.prisma.auditLog.create({
            data: {
                action: `UPDATED SUPPLIER: ${updated.name}`,
                performedBy: 'Manager',
                details: `Edited supplier card for ${updated.name}.`
            }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateSupplier = updateSupplier;
const createSupplier = async (req, res) => {
    try {
        const { name, contact, outstandingAdvance } = req.body;
        const newSupplier = await db_1.prisma.supplier.create({
            data: {
                name,
                contact: contact || '',
                outstandingAdvance: parseFloat(outstandingAdvance) || 0.0
            }
        });
        await db_1.prisma.auditLog.create({
            data: {
                action: `ADDED SUPPLIER: ${name}`,
                performedBy: 'Manager',
                details: `Created supplier card with outstanding advance of B$${outstandingAdvance || 0.0}`
            }
        });
        res.json(newSupplier);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.createSupplier = createSupplier;
