import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const vehicle = await prisma.vehicleInventory.findUnique({
        where: { id: parseInt(id) },
        include: {
          maintenanceLogs: { orderBy: { date: 'desc' }, take: 20 },
          fuelLogs: { orderBy: { date: 'desc' }, take: 20 },
        },
      });
      return NextResponse.json(vehicle);
    }

    const list = await prisma.vehicleInventory.findMany({
      select: {
        id: true, name: true, type: true, plateNumber: true, brand: true,
        model: true, year: true, status: true,
        roadTaxExpiry: true, insuranceExpiry: true, inspectionExpiry: true,
        roadTaxPdf: true, insurancePdf: true, registrationCardPdf: true, inspectionPdf: true,
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(list);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      type,
      plateNumber,
      brand,
      model,
      year,
      roadTaxExpiry,
      insuranceExpiry,
      inspectionExpiry,
      roadTaxPdf,
      insurancePdf,
      registrationCardPdf,
      inspectionPdf,
    } = body;

    const newVehicle = await prisma.vehicleInventory.create({
      data: {
        name,
        type,
        plateNumber,
        brand,
        model,
        year: parseInt(year) || new Date().getFullYear(),
        roadTaxExpiry: new Date(roadTaxExpiry),
        insuranceExpiry: new Date(insuranceExpiry),
        inspectionExpiry: new Date(inspectionExpiry || new Date()),
        status: 'Active',
        roadTaxPdf: roadTaxPdf || '',
        insurancePdf: insurancePdf || '',
        registrationCardPdf: registrationCardPdf || '',
        inspectionPdf: inspectionPdf || '',
      },
    });

    await prisma.auditLog.create({
      data: {
        action: `ADDED VEHICLE: ${name} [${plateNumber}]`,
        performedBy: 'Manager',
        details: `Registered company asset ${brand} ${model} to fleet management lists.`,
      },
    });

    return NextResponse.json(newVehicle);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}