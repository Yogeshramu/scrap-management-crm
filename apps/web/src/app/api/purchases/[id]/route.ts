import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';
import { withRetry } from '@/lib/retry';

export const PUT = withMiddleware(async (req: NextRequest) => {
  try {
    const id = req.nextUrl.pathname.split('/').at(-1)!;
    const body = await req.json();
    const {
      pickupLocation, logisticsMethod, driverName, paymentStatus, paymentMethod, notes,
      vehicleBrand, vehicleModel, registrationNo, otherInfo,
      engineIntact, gearboxPresent, catalyticConverter, battery, radiator, wiring,
      alloyWheelsCount, collectionDate, advancePaid,
      lotName, scrapDescription, grossTonnageEstimate,
      transportCompanyId, transportTripFee,
      vehicles,
    } = body;

    const existing = await prisma.purchase.findUnique({
      where: { id },
      select: {
        id: true, type: true, pickupLocation: true, logisticsMethod: true, driverName: true,
        paymentStatus: true, paymentMethod: true, notes: true, advancePaid: true,
        collectionDate: true, vehicleBrand: true, vehicleModel: true, registrationNo: true,
        otherInfo: true, engineIntact: true, gearboxPresent: true, catalyticConverter: true,
        battery: true, radiator: true, wiring: true, alloyWheelsCount: true,
        lotName: true, scrapDescription: true, grossTonnageEstimate: true,
        transportCompanyId: true, transportTripFee: true,
      },
    });
    if (!existing) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });

    const isHired = (logisticsMethod ?? existing.logisticsMethod) === 'HIRED_TOW_TRUCK' ||
                    (logisticsMethod ?? existing.logisticsMethod) === 'HIRED_LORRY';

    const updated = await withRetry(() => prisma.$transaction(async (tx) => {
      const record = await tx.purchase.update({
        where: { id },
        data: {
          pickupLocation: pickupLocation ?? existing.pickupLocation,
          logisticsMethod: logisticsMethod ?? existing.logisticsMethod,
          driverName: driverName ?? existing.driverName,
          paymentStatus: paymentStatus ?? existing.paymentStatus,
          paymentMethod: paymentMethod ?? existing.paymentMethod,
          notes: notes !== undefined ? notes : existing.notes,
          advancePaid: advancePaid !== undefined ? parseFloat(advancePaid) : existing.advancePaid,
          collectionDate: collectionDate !== undefined ? (collectionDate ? new Date(collectionDate) : null) : existing.collectionDate,
          vehicleBrand: existing.type === 'VEHICLE' ? (vehicleBrand ?? existing.vehicleBrand) : existing.vehicleBrand,
          vehicleModel: existing.type === 'VEHICLE' ? (vehicleModel ?? existing.vehicleModel) : existing.vehicleModel,
          registrationNo: existing.type === 'VEHICLE' ? (registrationNo ?? existing.registrationNo) : existing.registrationNo,
          otherInfo: existing.type === 'VEHICLE' ? (otherInfo ?? existing.otherInfo) : existing.otherInfo,
          engineIntact: existing.type === 'VEHICLE' ? (engineIntact !== undefined ? !!engineIntact : existing.engineIntact) : existing.engineIntact,
          gearboxPresent: existing.type === 'VEHICLE' ? (gearboxPresent !== undefined ? !!gearboxPresent : existing.gearboxPresent) : existing.gearboxPresent,
          catalyticConverter: existing.type === 'VEHICLE' ? (catalyticConverter !== undefined ? !!catalyticConverter : existing.catalyticConverter) : existing.catalyticConverter,
          battery: existing.type === 'VEHICLE' ? (battery !== undefined ? !!battery : existing.battery) : existing.battery,
          radiator: existing.type === 'VEHICLE' ? (radiator !== undefined ? !!radiator : existing.radiator) : existing.radiator,
          wiring: existing.type === 'VEHICLE' ? (wiring !== undefined ? !!wiring : existing.wiring) : existing.wiring,
          alloyWheelsCount: existing.type === 'VEHICLE' ? (alloyWheelsCount !== undefined ? parseInt(alloyWheelsCount) : existing.alloyWheelsCount) : existing.alloyWheelsCount,
          lotName: existing.type !== 'VEHICLE' ? (lotName ?? existing.lotName) : existing.lotName,
          scrapDescription: existing.type !== 'VEHICLE' ? (scrapDescription ?? existing.scrapDescription) : existing.scrapDescription,
          grossTonnageEstimate: existing.type !== 'VEHICLE' && grossTonnageEstimate !== undefined ? parseFloat(grossTonnageEstimate) : existing.grossTonnageEstimate,
          transportCompanyId: isHired && transportCompanyId ? parseInt(transportCompanyId) : (isHired ? existing.transportCompanyId : null),
          transportTripFee: transportTripFee !== undefined ? parseFloat(transportTripFee) : existing.transportTripFee,
        },
        include: { supplier: true, transportCompany: true },
      });

      if (Array.isArray(vehicles) && vehicles.length > 0) {
        await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });
        await tx.purchaseItem.createMany({
          data: vehicles.map((v: any) => ({
            id: `${id}-${v.itemIndex}`,
            purchaseId: id, itemIndex: v.itemIndex,
            vehicleBrand: v.vehicleBrand ?? '', vehicleModel: v.vehicleModel ?? '',
            registrationNo: v.registrationNo ?? '', otherInfo: v.otherInfo ?? '',
            alloyWheelsCount: v.alloyWheelsCount ?? 0, agreedPrice: v.agreedPrice ?? 0,
            engineIntact: v.engineIntact ?? true, gearboxPresent: v.gearboxPresent ?? true,
            catalyticConverter: v.catalyticConverter ?? true, battery: v.battery ?? true,
            radiator: v.radiator ?? true, wiring: v.wiring ?? true,
          })),
        });
      }

      await tx.auditLog.create({
        data: { action: `UPDATED PURCHASE ${id}`, performedBy: 'Manager', details: `Edited purchase ${id}. Status: ${paymentStatus ?? existing.paymentStatus}.` },
      });
      return record;
    }));

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'MANAGER', idempotent: true });
