import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

async function generateNextPurchaseId() {
  const currentYear = new Date().getFullYear();
  const count = await prisma.purchase.count();
  const nextNum = (count + 1).toString().padStart(3, '0');
  return `INV-${currentYear}-${nextNum}`;
}

export async function GET() {
  try {
    const purchases = await prisma.purchase.findMany({
      include: { supplier: true, transportCompany: true, scrapLineItems: true },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(purchases);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const deny = await requireRole(req, 'MANAGER');
  if (deny) return deny;
  try {
    const body = await req.json();
    const { type, supplierId, pickupLocation, logisticsMethod, driverName, agreedPrice, paymentStatus, paymentMethod,
      vehicleModel, engineIntact, gearboxPresent, catalyticConverter, alloyWheelsCount, vehiclePhoto,
      lotName, scrapDescription, scrapPhoto, grossTonnageEstimate, transportCompanyId, transportTripFee,
      lineItems } = body;

    const supplier = await prisma.supplier.findUnique({ where: { id: parseInt(supplierId) } });
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

    const isScrap = type === 'MIXED_SCRAP' || type === 'LOOSE_SCRAP';
    // For scrap modes, agreedPrice is the grand total of line items (sent from client)
    const price = parseFloat(agreedPrice);
    const advanceDeduction = supplier.outstandingAdvance > 0 ? Math.min(supplier.outstandingAdvance, price) : 0;
    const finalCashDue = price - advanceDeduction;
    const purchaseId = await generateNextPurchaseId();

    const result = await prisma.$transaction(async (tx) => {
      const record = await tx.purchase.create({
        data: {
          id: purchaseId, type, supplierId: supplier.id, pickupLocation, logisticsMethod,
          driverName: driverName || '', agreedPrice: price, previousAdvanceDeduction: advanceDeduction,
          cashToPay: finalCashDue, paymentStatus, paymentMethod,
          vehicleModel: type === 'VEHICLE' ? vehicleModel : null,
          engineIntact: type === 'VEHICLE' ? !!engineIntact : null,
          gearboxPresent: type === 'VEHICLE' ? !!gearboxPresent : null,
          catalyticConverter: type === 'VEHICLE' ? !!catalyticConverter : null,
          alloyWheelsCount: type === 'VEHICLE' ? parseInt(alloyWheelsCount) || 0 : 0,
          vehiclePhoto: type === 'VEHICLE' ? vehiclePhoto || '' : '',
          lotName: isScrap ? lotName : null,
          scrapDescription: isScrap ? scrapDescription : null,
          scrapPhoto: isScrap ? scrapPhoto || '' : '',
          grossTonnageEstimate: isScrap ? parseFloat(grossTonnageEstimate) || 0 : null,
          transportCompanyId: logisticsMethod === 'TOWING' && transportCompanyId ? parseInt(transportCompanyId) : null,
          transportTripFee: logisticsMethod === 'TOWING' && transportTripFee ? parseFloat(transportTripFee) : 0,
          transportPaymentStatus: logisticsMethod === 'TOWING' ? 'UNPAID' : 'N/A'
        }
      });
      if (isScrap && Array.isArray(lineItems) && lineItems.length > 0) {
        await tx.scrapLineItem.createMany({
          data: lineItems.map((li: any) => ({
            purchaseId: purchaseId,
            material: li.material,
            qty: parseFloat(li.qty),
            unit: li.unit,
            rate: parseFloat(li.rate),
            amount: parseFloat(li.qty) * parseFloat(li.rate)
          }))
        });
      }
      if (advanceDeduction > 0) {
        await tx.supplier.update({ where: { id: supplier.id }, data: { outstandingAdvance: { decrement: advanceDeduction } } });
      }
      if (paymentStatus === 'PAID') {
        await tx.cashBook.create({ data: { type: 'OUT', category: 'PURCHASE', amount: finalCashDue, referenceId: purchaseId, description: `Payment for purchase ${purchaseId} (${type} mode)` } });
      } else if (paymentStatus === 'PARTIAL') {
        await tx.cashBook.create({ data: { type: 'OUT', category: 'PURCHASE', amount: finalCashDue * 0.5, referenceId: purchaseId, description: `Partial advance deposit paid for purchase ${purchaseId}` } });
      }
      await tx.auditLog.create({ data: { action: `CREATED PURCHASE ${purchaseId}`, performedBy: 'Manager', details: `Processed purchase for ${supplier.name}. Price: B$${price}, Advance: B$${advanceDeduction}, Cash Due: B$${finalCashDue}.` } });
      return record;
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
