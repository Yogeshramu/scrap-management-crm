import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

export async function GET() {
  try {
    const purchases = await prisma.purchase.findMany({
      take: 50,
      include: {
        supplier: { select: { id: true, name: true, contact: true, outstandingAdvance: true } },
        transportCompany: { select: { id: true, name: true, phone: true } },
        scrapLineItems: true,
      },
      orderBy: { date: 'desc' },
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
    const {
      type, supplierId, pickupLocation, logisticsMethod, driverName, agreedPrice,
      paymentStatus, paymentMethod, notes,
      // Vehicle fields
      vehicleBrand, vehicleModel, registrationNo, otherInfo,
      engineIntact, gearboxPresent, catalyticConverter, battery, radiator, wiring,
      alloyWheelsCount, vehiclePhoto, collectionDate, advancePaid,
      // Scrap fields
      lotName, scrapDescription, scrapPhoto, grossTonnageEstimate,
      // Logistics
      transportCompanyId, transportTripFee,
      lineItems
    } = body;

    const supplier = await prisma.supplier.findUnique({ where: { id: parseInt(supplierId) } });
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

    const isScrap = type === 'MIXED_SCRAP' || type === 'LOOSE_SCRAP';
    const price = parseFloat(agreedPrice) || 0;
    const advance = parseFloat(advancePaid) || 0;
    const advanceDeduction = supplier.outstandingAdvance > 0 ? Math.min(supplier.outstandingAdvance, price) : 0;
    const finalCashDue = price - advance;
    const isHired = logisticsMethod === 'HIRED_TOW_TRUCK' || logisticsMethod === 'HIRED_LORRY';

    const result = await prisma.$transaction(async (tx) => {
      // Generate ID inside transaction to prevent race conditions
      const currentYear = new Date().getFullYear();
      const last = await tx.purchase.findFirst({
        where: { id: { startsWith: `PUR-${currentYear}-` } },
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      const lastNum = last ? parseInt(last.id.split('-')[2]) : 0;
      const purchaseId = `PUR-${currentYear}-${(lastNum + 1).toString().padStart(3, '0')}`;
      const record = await tx.purchase.create({
        data: {
          id: purchaseId, type, supplierId: supplier.id, pickupLocation,
          logisticsMethod, driverName: driverName || '',
          agreedPrice: price, previousAdvanceDeduction: advanceDeduction,
          cashToPay: finalCashDue, paymentStatus, paymentMethod,
          notes: notes || null,
          advancePaid: advance,
          collectionDate: collectionDate ? new Date(collectionDate) : null,
          // Vehicle
          vehicleBrand: type === 'VEHICLE' ? vehicleBrand || null : null,
          vehicleModel: type === 'VEHICLE' ? vehicleModel || null : null,
          registrationNo: type === 'VEHICLE' ? registrationNo || null : null,
          otherInfo: type === 'VEHICLE' ? otherInfo || null : null,
          engineIntact: type === 'VEHICLE' ? !!engineIntact : null,
          gearboxPresent: type === 'VEHICLE' ? !!gearboxPresent : null,
          catalyticConverter: type === 'VEHICLE' ? !!catalyticConverter : null,
          battery: type === 'VEHICLE' ? !!battery : null,
          radiator: type === 'VEHICLE' ? !!radiator : null,
          wiring: type === 'VEHICLE' ? !!wiring : null,
          alloyWheelsCount: type === 'VEHICLE' ? parseInt(alloyWheelsCount) || 0 : 0,
          vehiclePhoto: type === 'VEHICLE' ? vehiclePhoto || '' : '',
          // Scrap
          lotName: isScrap ? lotName : null,
          scrapDescription: isScrap ? scrapDescription : null,
          scrapPhoto: isScrap ? scrapPhoto || '' : '',
          grossTonnageEstimate: isScrap ? parseFloat(grossTonnageEstimate) || 0 : null,
          // Transport
          transportCompanyId: isHired && transportCompanyId ? parseInt(transportCompanyId) : null,
          transportTripFee: isHired && transportTripFee ? parseFloat(transportTripFee) : 0,
          transportPaymentStatus: isHired ? 'UNPAID' : 'N/A'
        }
      });

      if (isScrap && Array.isArray(lineItems) && lineItems.length > 0) {
        await tx.scrapLineItem.createMany({
          data: lineItems.map((li: any) => ({
            purchaseId, material: li.material,
            qty: parseFloat(li.qty), unit: li.unit,
            rate: parseFloat(li.rate),
            amount: parseFloat(li.qty) * parseFloat(li.rate)
          }))
        });
      }

      if (advanceDeduction > 0) {
        await tx.supplier.update({ where: { id: supplier.id }, data: { outstandingAdvance: { decrement: advanceDeduction } } });
      }

      if (paymentStatus === 'PAID') {
        await tx.cashBook.create({ data: { type: 'OUT', category: 'PURCHASE', amount: price, referenceId: purchaseId, description: `Payment for purchase ${purchaseId}` } });
      } else if (paymentStatus === 'PARTIAL' && advance > 0) {
        await tx.cashBook.create({ data: { type: 'OUT', category: 'PURCHASE', amount: advance, referenceId: purchaseId, description: `Partial payment for purchase ${purchaseId}` } });
      }

      await tx.auditLog.create({ data: { action: `CREATED PURCHASE ${purchaseId}`, performedBy: 'Manager', details: `Purchase for ${supplier.name}. Price: B$${price}, Advance: B$${advance}.` } });
      return record;
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
