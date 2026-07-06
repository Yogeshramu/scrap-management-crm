import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { pickupLocation, logisticsMethod, driverName, paymentStatus, paymentMethod,
      vehicleModel, engineIntact, gearboxPresent, catalyticConverter, alloyWheelsCount,
      lotName, scrapDescription, grossTonnageEstimate, transportCompanyId, transportTripFee } = body;

    const existing = await prisma.purchase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });

    const updated = await prisma.$transaction(async (tx) => {
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
      await tx.auditLog.create({ data: { action: `UPDATED PURCHASE ${id}`, performedBy: 'Manager', details: `Edited purchase ${id}. Status: ${paymentStatus ?? existing.paymentStatus}.` } });
      return record;
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
