import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      pickupLocation, logisticsMethod, driverName, paymentStatus, paymentMethod, notes,
      vehicleBrand, vehicleModel, registrationNo, otherInfo,
      engineIntact, gearboxPresent, catalyticConverter, battery, radiator, wiring,
      alloyWheelsCount, collectionDate, advancePaid,
      lotName, scrapDescription, grossTonnageEstimate,
      transportCompanyId, transportTripFee
    } = body;

    const existing = await prisma.purchase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });

    const isHired = (logisticsMethod ?? existing.logisticsMethod) === 'HIRED_TOW_TRUCK' ||
                    (logisticsMethod ?? existing.logisticsMethod) === 'HIRED_LORRY';

    const updated = await prisma.$transaction(async (tx) => {
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
        include: { supplier: true, transportCompany: true }
      });
      await tx.auditLog.create({ data: { action: `UPDATED PURCHASE ${id}`, performedBy: 'Manager', details: `Edited purchase ${id}. Status: ${paymentStatus ?? existing.paymentStatus}.` } });
      return record;
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
