import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';

export const GET = withMiddleware(async (req: NextRequest) => {
  try {
    const id = parseInt(req.nextUrl.pathname.split('/').at(-1)!);
    const vehicle = await prisma.vehicleInventory.findUnique({
      where: { id },
      include: { maintenanceLogs: true, fuelLogs: true },
    });
    if (!vehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    return NextResponse.json(vehicle);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'STAFF' });

export const PUT = withMiddleware(async (req: NextRequest) => {
  try {
    const id = parseInt(req.nextUrl.pathname.split('/').at(-1)!);
    const { name, type, brand, model, year, roadTaxExpiry, insuranceExpiry, inspectionExpiry, status } = await req.json();
    const existing = await prisma.vehicleInventory.findUnique({ where: { id }, select: { id: true, name: true, plateNumber: true, type: true, brand: true, model: true, year: true, roadTaxExpiry: true, insuranceExpiry: true, inspectionExpiry: true, status: true } });
    if (!existing) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    const updated = await prisma.vehicleInventory.update({
      where: { id },
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
    await prisma.auditLog.create({ data: { action: `UPDATED VEHICLE: ${updated.name} [${updated.plateNumber}]`, performedBy: 'Manager', details: `Road tax: ${updated.roadTaxExpiry.toISOString().split('T')[0]}` } });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'MANAGER', idempotent: true });
