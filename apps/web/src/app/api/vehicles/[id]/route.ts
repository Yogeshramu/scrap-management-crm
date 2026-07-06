import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, type, brand, model, year, roadTaxExpiry, insuranceExpiry, inspectionExpiry, status } = body;

    const existing = await prisma.vehicleInventory.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });

    const updated = await prisma.vehicleInventory.update({
      where: { id: parseInt(id) },
      data: {
        name: name ?? existing.name,
        type: type ?? existing.type,
        brand: brand ?? existing.brand,
        model: model ?? existing.model,
        year: year !== undefined ? parseInt(year) : existing.year,
        roadTaxExpiry: roadTaxExpiry ? new Date(roadTaxExpiry) : existing.roadTaxExpiry,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : existing.insuranceExpiry,
        inspectionExpiry: inspectionExpiry ? new Date(inspectionExpiry) : existing.inspectionExpiry,
        status: status ?? existing.status,
      },
      include: { maintenanceLogs: true, fuelLogs: true },
    });

    await prisma.auditLog.create({
      data: {
        action: `UPDATED VEHICLE: ${updated.name} [${updated.plateNumber}]`,
        performedBy: 'Manager',
        details: `Edited fleet asset ${updated.name}. Road tax: ${updated.roadTaxExpiry.toISOString().split('T')[0]}.`,
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}