import { Request, Response } from 'express';
import { prisma } from '@nur-afiq/db';

async function generateNextPurchaseId() {
  const currentYear = new Date().getFullYear();
  const count = await prisma.purchase.count();
  const nextNum = (count + 1).toString().padStart(3, '0');
  return `INV-${currentYear}-${nextNum}`;
}

export const getPurchases = async (req: Request, res: Response) => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: true,
        transportCompany: true
      },
      orderBy: { date: 'desc' }
    });
    res.json(purchases);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createPurchase = async (req: Request, res: Response) => {
  try {
    const {
      type,
      supplierId,
      pickupLocation,
      logisticsMethod,
      driverName,
      agreedPrice,
      paymentStatus,
      paymentMethod,
      vehicleModel,
      engineIntact,
      gearboxPresent,
      catalyticConverter,
      alloyWheelsCount,
      vehiclePhoto,
      lotName,
      scrapDescription,
      scrapPhoto,
      grossTonnageEstimate,
      transportCompanyId,
      transportTripFee
    } = req.body;

    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(supplierId) }
    });
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

    let advanceDeduction = 0.0;
    const price = parseFloat(agreedPrice);

    if (supplier.outstandingAdvance > 0) {
      advanceDeduction = Math.min(supplier.outstandingAdvance, price);
    }
    const finalCashDue = price - advanceDeduction;

    const purchaseId = await generateNextPurchaseId();

    const result = await prisma.$transaction(async (tx: any) => {
      const record = await tx.purchase.create({
        data: {
          id: purchaseId,
          type,
          supplierId: supplier.id,
          pickupLocation,
          logisticsMethod,
          driverName: driverName || '',
          agreedPrice: price,
          previousAdvanceDeduction: advanceDeduction,
          cashToPay: finalCashDue,
          paymentStatus,
          paymentMethod,
          vehicleModel: type === 'VEHICLE' ? vehicleModel : null,
          engineIntact: type === 'VEHICLE' ? !!engineIntact : null,
          gearboxPresent: type === 'VEHICLE' ? !!gearboxPresent : null,
          catalyticConverter: type === 'VEHICLE' ? !!catalyticConverter : null,
          alloyWheelsCount: type === 'VEHICLE' ? parseInt(alloyWheelsCount) || 0 : 0,
          vehiclePhoto: type === 'VEHICLE' ? vehiclePhoto || '' : '',
          lotName: type === 'MIXED_SCRAP' ? lotName : null,
          scrapDescription: type === 'MIXED_SCRAP' ? scrapDescription : null,
          scrapPhoto: type === 'MIXED_SCRAP' ? scrapPhoto || '' : '',
          grossTonnageEstimate: type === 'MIXED_SCRAP' ? parseFloat(grossTonnageEstimate) || 0.0 : null,
          transportCompanyId: logisticsMethod === 'TOWING' && transportCompanyId ? parseInt(transportCompanyId) : null,
          transportTripFee: logisticsMethod === 'TOWING' && transportTripFee ? parseFloat(transportTripFee) : 0.0,
          transportPaymentStatus: logisticsMethod === 'TOWING' ? 'UNPAID' : 'N/A'
        }
      });

      if (advanceDeduction > 0) {
        await tx.supplier.update({
          where: { id: supplier.id },
          data: { outstandingAdvance: { decrement: advanceDeduction } }
        });
      }

      if (paymentStatus === 'PAID') {
        await tx.cashBook.create({
          data: {
            type: 'OUT',
            category: 'PURCHASE',
            amount: finalCashDue,
            referenceId: purchaseId,
            description: `Payment for purchase ${purchaseId} (${type} mode)`
          }
        });
      } else if (paymentStatus === 'PARTIAL') {
        await tx.cashBook.create({
          data: {
            type: 'OUT',
            category: 'PURCHASE',
            amount: finalCashDue * 0.5,
            referenceId: purchaseId,
            description: `Partial advance deposit paid for purchase ${purchaseId}`
          }
        });
      }

      await tx.auditLog.create({
        data: {
          action: `CREATED PURCHASE ${purchaseId}`,
          performedBy: 'Manager',
          details: `Processed purchase for ${supplier.name}. Flat Price: B$${price}, Advance Deducted: B$${advanceDeduction}, Cash Due: B$${finalCashDue}. Logistics: ${logisticsMethod}.`
        }
      });

      return record;
    });

    res.json(result);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const updatePurchase = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      pickupLocation,
      logisticsMethod,
      driverName,
      paymentStatus,
      paymentMethod,
      vehicleModel,
      engineIntact,
      gearboxPresent,
      catalyticConverter,
      alloyWheelsCount,
      lotName,
      scrapDescription,
      grossTonnageEstimate,
      transportCompanyId,
      transportTripFee
    } = req.body;

    const existing = await prisma.purchase.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Purchase not found' });

    const updated = await prisma.$transaction(async (tx: any) => {
      const record = await tx.purchase.update({
        where: { id },
        data: {
          pickupLocation: pickupLocation ?? existing.pickupLocation,
          logisticsMethod: logisticsMethod ?? existing.logisticsMethod,
          driverName: driverName ?? existing.driverName,
          paymentStatus: paymentStatus ?? existing.paymentStatus,
          paymentMethod: paymentMethod ?? existing.paymentMethod,
          vehicleModel: existing.type === 'VEHICLE' ? (vehicleModel ?? existing.vehicleModel) : existing.vehicleModel,
          engineIntact: existing.type === 'VEHICLE' ? (engineIntact !== undefined ? !!engineIntact : existing.engineIntact) : existing.engineIntact,
          gearboxPresent: existing.type === 'VEHICLE' ? (gearboxPresent !== undefined ? !!gearboxPresent : existing.gearboxPresent) : existing.gearboxPresent,
          catalyticConverter: existing.type === 'VEHICLE' ? (catalyticConverter !== undefined ? !!catalyticConverter : existing.catalyticConverter) : existing.catalyticConverter,
          alloyWheelsCount: existing.type === 'VEHICLE' ? (alloyWheelsCount !== undefined ? parseInt(alloyWheelsCount) : existing.alloyWheelsCount) : existing.alloyWheelsCount,
          lotName: existing.type === 'MIXED_SCRAP' ? (lotName ?? existing.lotName) : existing.lotName,
          scrapDescription: existing.type === 'MIXED_SCRAP' ? (scrapDescription ?? existing.scrapDescription) : existing.scrapDescription,
          grossTonnageEstimate: existing.type === 'MIXED_SCRAP' && grossTonnageEstimate !== undefined ? parseFloat(grossTonnageEstimate) : existing.grossTonnageEstimate,
          transportCompanyId: logisticsMethod === 'TOWING' && transportCompanyId ? parseInt(transportCompanyId) : (logisticsMethod === 'TOWING' ? existing.transportCompanyId : null),
          transportTripFee: transportTripFee !== undefined ? parseFloat(transportTripFee) : existing.transportTripFee,
        },
        include: { supplier: true, transportCompany: true }
      });

      await tx.auditLog.create({
        data: {
          action: `UPDATED PURCHASE ${id}`,
          performedBy: 'Manager',
          details: `Edited purchase record ${id}. Payment status: ${paymentStatus ?? existing.paymentStatus}.`
        }
      });

      return record;
    });

    res.json(updated);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
