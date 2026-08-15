import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/apiMiddleware';
import { withRetry } from '@/lib/retry';

export const GET = withMiddleware(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const vehicle = await withRetry(() => prisma.vehicleInventory.findUnique({
      where: { id: parseInt(id) },
      include: {
        maintenanceLogs: { orderBy: { date: 'desc' }, take: 10 },
        fuelLogs: { orderBy: { date: 'desc' }, take: 10 },
      },
    }));
    return NextResponse.json(vehicle);
  }

  const list = await withRetry(() => prisma.vehicleInventory.findMany({
    select: {
      id: true, name: true, type: true, plateNumber: true, brand: true,
      model: true, year: true, status: true,
      roadTaxExpiry: true, insuranceExpiry: true, inspectionExpiry: true,
      roadTaxPdf: true, insurancePdf: true, registrationCardPdf: true, inspectionPdf: true,
    },
    orderBy: { name: 'asc' },
  }));
  return NextResponse.json(list);
});

export const POST = withMiddleware(async (req: NextRequest) => {
  try {
    const { name, type, plateNumber, brand, model, year, roadTaxExpiry, insuranceExpiry, inspectionExpiry, roadTaxPdf, insurancePdf, registrationCardPdf, inspectionPdf } = await req.json();
    const vehicle = await withRetry(() => prisma.vehicleInventory.create({
      data: {
        name, type, plateNumber, brand, model,
        year: parseInt(year) || new Date().getFullYear(),
        roadTaxExpiry: new Date(roadTaxExpiry),
        insuranceExpiry: new Date(insuranceExpiry),
        inspectionExpiry: new Date(inspectionExpiry || new Date()),
        status: 'Active',
        roadTaxPdf: roadTaxPdf || '', insurancePdf: insurancePdf || '',
        registrationCardPdf: registrationCardPdf || '', inspectionPdf: inspectionPdf || '',
      },
    }));
    prisma.auditLog.create({
      data: { action: `ADDED VEHICLE: ${name} [${plateNumber}]`, performedBy: 'Manager', details: `Registered ${brand} ${model} to fleet.` },
    }).catch(console.error);
    return NextResponse.json(vehicle, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}, { minRole: 'MANAGER', idempotent: true });
