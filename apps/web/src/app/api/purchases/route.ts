import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';
import { withRetry } from '@/lib/retry';

export const GET = withMiddleware(async (_req: NextRequest) => {
  const purchases = await withRetry(() => prisma.purchase.findMany({
    take: 50,
    select: {
      id: true, type: true, date: true, supplierId: true, pickupLocation: true,
      logisticsMethod: true, driverName: true, agreedPrice: true, advancePaid: true,
      previousAdvanceDeduction: true, cashToPay: true, paymentStatus: true, paymentMethod: true,
      notes: true, collectionDate: true,
      vehicleBrand: true, vehicleModel: true, registrationNo: true, otherInfo: true,
      engineIntact: true, gearboxPresent: true, catalyticConverter: true, battery: true,
      radiator: true, wiring: true, alloyWheelsCount: true, vehiclePhoto: true,
      lotName: true, scrapDescription: true, scrapPhoto: true, grossTonnageEstimate: true,
      transportTripFee: true, transportPaymentStatus: true, transportCompanyName: true,
      supplier: { select: { id: true, name: true, contact: true, outstandingAdvance: true } },
      transportCompany: { select: { id: true, name: true, phone: true } },
      purchaseItems: { select: { id: true, itemIndex: true, vehicleBrand: true, vehicleModel: true, registrationNo: true, agreedPrice: true } },
    },
    orderBy: { date: 'desc' },
  }));
  return NextResponse.json(purchases, {
    headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=30' },
  });
}, { minRole: 'STAFF' });

export const POST = withMiddleware(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const {
      type, supplierId, pickupLocation, logisticsMethod, driverName, agreedPrice,
      paymentStatus, paymentMethod, notes,
      vehicleBrand, vehicleModel, registrationNo, otherInfo,
      engineIntact, gearboxPresent, catalyticConverter, battery, radiator, wiring,
      alloyWheelsCount, vehiclePhoto, collectionDate, advancePaid,
      lotName, scrapDescription, scrapCode, scrapPhoto, grossTonnageEstimate,
      transportCompanyId, transportCompanyName, transportTripFee,
      lineItems,
    } = body;

    
    // ── Input validation ────────────────────────────────────────────────────
    const VALID_TYPES = ['VEHICLE', 'LOOSE_SCRAP', 'MIXED_SCRAP'];
    const VALID_LOGISTICS = ['OUR_TOW_TRUCK', 'OUR_LORRY', 'HIRED_TOW_TRUCK', 'HIRED_LORRY', 'SUPPLIER_DELIVERED'];
    const VALID_PAYMENT_STATUS = ['PAID', 'PARTIAL', 'UNPAID'];
    const VALID_PAYMENT_METHOD = ['CASH', 'BANK_TRANSFER'];

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
    }
    if (!supplierId) {
      return NextResponse.json({ error: 'supplierId is required' }, { status: 400 });
    }
    if (!pickupLocation || !String(pickupLocation).trim()) {
      return NextResponse.json({ error: 'pickupLocation is required' }, { status: 400 });
    }
    if (!VALID_LOGISTICS.includes(logisticsMethod)) {
      return NextResponse.json({ error: `Invalid logisticsMethod. Must be one of: ${VALID_LOGISTICS.join(', ')}` }, { status: 400 });
    }
    if (!VALID_PAYMENT_STATUS.includes(paymentStatus)) {
      return NextResponse.json({ error: `Invalid paymentStatus. Must be one of: ${VALID_PAYMENT_STATUS.join(', ')}` }, { status: 400 });
    }
    if (!VALID_PAYMENT_METHOD.includes(paymentMethod)) {
      return NextResponse.json({ error: `Invalid paymentMethod. Must be one of: ${VALID_PAYMENT_METHOD.join(', ')}` }, { status: 400 });
    }
    const parsedPrice = parseFloat(agreedPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: 'agreedPrice must be a non-negative number' }, { status: 400 });
    }
    if (lineItems !== undefined && !Array.isArray(lineItems)) {
      return NextResponse.json({ error: 'lineItems must be an array' }, { status: 400 });
    }
    if (Array.isArray(lineItems)) {
      for (const li of lineItems) {
        if (!li.material || isNaN(parseFloat(li.qty)) || isNaN(parseFloat(li.rate))) {
          return NextResponse.json({ error: 'Each lineItem must have material, qty, and rate' }, { status: 400 });
        }
      }
    }
    // ── End validation ──────────────────────────────────────────────────────

    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(supplierId) },
      select: { id: true, name: true, outstandingAdvance: true },
    });
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

    const isScrap = type === 'MIXED_SCRAP' || type === 'LOOSE_SCRAP';
    const price = parseFloat(agreedPrice) || 0;
    const advance = parseFloat(advancePaid) || 0;
    const advanceDeduction = supplier.outstandingAdvance > 0 ? Math.min(supplier.outstandingAdvance, price) : 0;
    const isHired = logisticsMethod === 'HIRED_TOW_TRUCK' || logisticsMethod === 'HIRED_LORRY';

    const currentYear = new Date().getFullYear();
    const lastPurchase = await prisma.purchase.findFirst({
      where: { id: { startsWith: `PUR-${currentYear}-` } },
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    const purchaseId = `PUR-${currentYear}-${((lastPurchase ? parseInt(lastPurchase.id.split('-')[2]) : 0) + 1).toString().padStart(3, '0')}`;

    const result = await withRetry(() => prisma.$transaction(async (tx) => {
      const record = await tx.purchase.create({
        data: {
          id: purchaseId, type, supplierId: supplier.id, pickupLocation,
          logisticsMethod, driverName: driverName || '',
          agreedPrice: price, previousAdvanceDeduction: advanceDeduction,
          cashToPay: price - advance, paymentStatus, paymentMethod,
          notes: notes || null, advancePaid: advance,
          collectionDate: collectionDate ? new Date(collectionDate) : null,
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
          lotName: isScrap ? lotName : null,
          scrapCode: isScrap ? scrapCode || null : null,
          scrapDescription: isScrap ? scrapDescription : null,
          scrapPhoto: isScrap ? scrapPhoto || '' : '',
          grossTonnageEstimate: isScrap ? parseFloat(grossTonnageEstimate) || 0 : null,
          transportCompanyId: isHired && transportCompanyId ? parseInt(transportCompanyId) : null,
          transportCompanyName: isHired ? transportCompanyName || null : null,
          transportTripFee: isHired && transportTripFee ? parseFloat(transportTripFee) : 0,
          transportPaymentStatus: isHired ? 'UNPAID' : 'N/A',
        },
      });

      const ops: Promise<unknown>[] = [];

      if (isScrap && Array.isArray(lineItems) && lineItems.length > 0) {
        ops.push(tx.scrapLineItem.createMany({
          data: lineItems.map((li: any) => ({
            purchaseId, material: li.material,
            qty: parseFloat(li.qty), unit: li.unit,
            rate: parseFloat(li.rate),
            amount: parseFloat(li.qty) * parseFloat(li.rate),
          })),
        }));
      }

      if (type === 'VEHICLE' && Array.isArray(body.vehicles) && body.vehicles.length > 0) {
        ops.push(tx.purchaseItem.createMany({
          data: body.vehicles.map((v: any, idx: number) => ({
            id: `${purchaseId}-${idx + 1}`,
            purchaseId, itemIndex: idx + 1,
            vehicleBrand: v.brand || null, vehicleModel: v.model || null,
            registrationNo: v.regNo || null, otherInfo: v.otherInfo || null,
            engineIntact: v.engineIntact ?? true, gearboxPresent: v.gearboxPresent ?? true,
            catalyticConverter: v.catalyticConverter ?? true, battery: v.battery ?? true,
            radiator: v.radiator ?? true, wiring: v.wiring ?? true,
            alloyWheelsCount: parseInt(v.alloyWheels) || 0,
            agreedPrice: parseFloat(v.price) || 0,
            logisticsMethod: v.logisticsMethod || logisticsMethod,
            collectionDate: v.collectionDate ? new Date(v.collectionDate) : (collectionDate ? new Date(collectionDate) : null),
            driverName: v.driverName || driverName || null,
            transportCompanyId: v.transportCompanyId ? parseInt(v.transportCompanyId) : null,
            transportCompanyName: v.transportCompanyName || null,
            transportTripFee: parseFloat(v.transportTripFee) || 0,
          })),
        }));
      }

      if (advanceDeduction > 0) {
        ops.push(tx.supplier.update({ where: { id: supplier.id }, data: { outstandingAdvance: { decrement: advanceDeduction } } }));
      }

      if (paymentStatus === 'PAID' || (paymentStatus === 'PARTIAL' && advance > 0)) {
        ops.push(tx.cashBook.create({
          data: { type: 'OUT', category: 'PURCHASE', amount: paymentStatus === 'PAID' ? price : advance, referenceId: purchaseId, description: `${paymentStatus === 'PAID' ? 'Full' : 'Partial'} payment for purchase ${purchaseId}` },
        }));
      }

      await Promise.all(ops);
      return record;
    }));

    prisma.auditLog.create({
      data: { action: `CREATED PURCHASE ${result.id}`, performedBy: 'Manager', details: `Supplier: ${supplier.name}. Price: B$${price}, Advance: B$${advance}.` },
    }).catch(console.error);

    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'MANAGER', idempotent: true });
