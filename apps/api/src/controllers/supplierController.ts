import { Request, Response } from 'express';
import { prisma } from '@nur-afiq/db';

export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const list = await prisma.supplier.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, contact, outstandingAdvance } = req.body;

    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Supplier not found' });

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        contact: contact ?? existing.contact,
        outstandingAdvance: outstandingAdvance !== undefined ? parseFloat(outstandingAdvance) : existing.outstandingAdvance
      }
    });

    await prisma.auditLog.create({
      data: {
        action: `UPDATED SUPPLIER: ${updated.name}`,
        performedBy: 'Manager',
        details: `Edited supplier card for ${updated.name}.`
      }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const { name, contact, outstandingAdvance } = req.body;

    const newSupplier = await prisma.supplier.create({
      data: {
        name,
        contact: contact || '',
        outstandingAdvance: parseFloat(outstandingAdvance) || 0.0
      }
    });

    await prisma.auditLog.create({
      data: {
        action: `ADDED SUPPLIER: ${name}`,
        performedBy: 'Manager',
        details: `Created supplier card with outstanding advance of B$${outstandingAdvance || 0.0}`
      }
    });

    res.json(newSupplier);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
