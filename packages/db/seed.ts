/// <reference types="node" />

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.auditLog.deleteMany({});
  await prisma.cashBook.deleteMany({});
  await prisma.saleItem.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.purchase.deleteMany({});
  await prisma.transporterPayment.deleteMany({});
  await prisma.transportCompany.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.vehicleMaintenance.deleteMany({});
  await prisma.vehicleFuel.deleteMany({});
  await prisma.vehicleInventory.deleteMany({});

  // ─── Suppliers ───────────────────────────────────────────────────────────────
  const supplierLab = await prisma.supplier.create({
    data: { name: 'Syarikat LAB Ent.', contact: '+673 8812345', outstandingAdvance: 300.0 }
  });
  const supplierMohammad = await prisma.supplier.create({
    data: { name: 'Haji Mohammad', contact: '+673 8924567', outstandingAdvance: 0.0 }
  });
  const supplierKbMetal = await prisma.supplier.create({
    data: { name: 'KB Metal Recycling', contact: '+673 8624109', outstandingAdvance: 0.0 }
  });
  const supplierMaju = await prisma.supplier.create({
    data: { name: 'Maju Engineering', contact: '+673 8412093', outstandingAdvance: 150.0 }
  });
  const supplierAzri = await prisma.supplier.create({
    data: { name: 'Azri Auto Parts', contact: '+673 8731200', outstandingAdvance: 0.0 }
  });
  const supplierSeria = await prisma.supplier.create({
    data: { name: 'Seria Salvage Works', contact: '+673 8556789', outstandingAdvance: 500.0 }
  });

  // ─── Transport Companies ──────────────────────────────────────────────────────
  const towingZafar = await prisma.transportCompany.create({
    data: { name: 'Zafar Towing', phone: '+673 8981234' }
  });
  const towingJaffer = await prisma.transportCompany.create({
    data: { name: 'Jaffer Towing', phone: '+673 8743210' }
  });
  const towingJune = await prisma.transportCompany.create({
    data: { name: 'June Towing', phone: '+673 8312093' }
  });
  const towingRahman = await prisma.transportCompany.create({
    data: { name: 'Rahman Express Tow', phone: '+673 8190045' }
  });

  // ─── Customers ────────────────────────────────────────────────────────────────
  const customerMetalCorp = await prisma.customer.create({
    data: { name: 'MetalCorp Brunei', contact: '+673 2420912' }
  });
  const customerSengHong = await prisma.customer.create({
    data: { name: 'Seng Hong Industry', contact: '+673 2771890' }
  });
  const customerBruneiSteel = await prisma.customer.create({
    data: { name: 'Brunei Steel Holdings', contact: '+673 2334567' }
  });
  const customerKbRecycle = await prisma.customer.create({
    data: { name: 'KB Recycle Centre', contact: '+673 3341122' }
  });

  // ─── Vehicles ─────────────────────────────────────────────────────────────────
  const vehicle1 = await prisma.vehicleInventory.create({
    data: {
      name: 'Fuso HIAB Crane',
      type: 'HIAB',
      plateNumber: 'BA-1234',
      brand: 'Mitsubishi',
      model: 'Fuso Crane 6T',
      year: 2020,
      roadTaxExpiry: new Date('2026-07-28'),
      insuranceExpiry: new Date('2026-07-15'),
      inspectionExpiry: new Date('2026-06-01'),
      status: 'Warning',
      roadTaxPdf: '/documents/road_tax_ba1234.pdf',
      insurancePdf: '/documents/ins_ba1234.pdf',
      registrationCardPdf: '/documents/reg_ba1234.pdf',
      inspectionPdf: '/documents/insp_ba1234.pdf'
    }
  });

  const vehicle2 = await prisma.vehicleInventory.create({
    data: {
      name: 'Dyna Tow Truck',
      type: 'Tow Truck',
      plateNumber: 'KB-9876',
      brand: 'Toyota',
      model: 'Dyna 3.0',
      year: 2018,
      roadTaxExpiry: new Date('2027-01-10'),
      insuranceExpiry: new Date('2026-12-15'),
      inspectionExpiry: new Date('2026-11-20'),
      status: 'Active'
    }
  });

  const vehicle3 = await prisma.vehicleInventory.create({
    data: {
      name: 'Hilux Field Runner',
      type: 'SUV',
      plateNumber: 'BA-5501',
      brand: 'Toyota',
      model: 'Hilux 2.8 4x4',
      year: 2021,
      roadTaxExpiry: new Date('2027-03-15'),
      insuranceExpiry: new Date('2027-02-28'),
      inspectionExpiry: new Date('2027-01-10'),
      status: 'Active',
      roadTaxPdf: '/documents/road_tax_ba5501.pdf',
      insurancePdf: '/documents/ins_ba5501.pdf',
      registrationCardPdf: '/documents/reg_ba5501.pdf'
    }
  });

  // Maintenance Logs
  await prisma.vehicleMaintenance.create({
    data: {
      vehicleId: vehicle1.id,
      date: new Date('2026-05-10'),
      service: 'General Hydraulic Servicing & Oil Seal Replacement',
      cost: 450.00,
      workshop: 'Seria Mechanical Workshop'
    }
  });
  await prisma.vehicleMaintenance.create({
    data: {
      vehicleId: vehicle2.id,
      date: new Date('2026-06-02'),
      service: 'Brake Pad Replacement & Tyre Swap',
      cost: 180.00,
      workshop: 'Kuala Belait Tyre Service'
    }
  });
  await prisma.vehicleMaintenance.create({
    data: {
      vehicleId: vehicle3.id,
      date: new Date('2026-04-20'),
      service: 'Full Engine Oil Change & Air Filter',
      cost: 95.00,
      workshop: 'Seria Mechanical Workshop'
    }
  });

  // Fuel Records
  await prisma.vehicleFuel.create({
    data: { vehicleId: vehicle1.id, date: new Date('2026-06-14'), amount: 85.5, cost: 95.00, odometer: 142050 }
  });
  await prisma.vehicleFuel.create({
    data: { vehicleId: vehicle2.id, date: new Date('2026-06-10'), amount: 60.0, cost: 68.00, odometer: 87320 }
  });
  await prisma.vehicleFuel.create({
    data: { vehicleId: vehicle3.id, date: new Date('2026-06-12'), amount: 45.0, cost: 50.50, odometer: 34100 }
  });

  // ─── Purchases ────────────────────────────────────────────────────────────────
  await prisma.purchase.create({
    data: {
      id: 'INV-2026-089',
      type: 'VEHICLE',
      date: new Date('2026-06-15T09:15:00Z'),
      supplierId: supplierLab.id,
      pickupLocation: 'Sengkurong Site Clearance',
      logisticsMethod: 'HIAB',
      driverName: 'Sufri',
      agreedPrice: 1000.0,
      previousAdvanceDeduction: 300.0,
      cashToPay: 700.0,
      paymentStatus: 'UNPAID',
      paymentMethod: 'CASH',
      vehicleModel: 'Toyota Hilux Double Cab',
      engineIntact: true,
      gearboxPresent: true,
      catalyticConverter: true,
      alloyWheelsCount: 4,
      vehiclePhoto: '/uploads/hilux_front.jpg',
      transportCompanyId: towingZafar.id,
      transportTripFee: 80.0,
      transportPaymentStatus: 'UNPAID'
    }
  });

  await prisma.purchase.create({
    data: {
      id: 'INV-2026-088',
      type: 'VEHICLE',
      date: new Date('2026-06-15T11:30:00Z'),
      supplierId: supplierMohammad.id,
      pickupLocation: 'Kuala Belait Yard Hub',
      logisticsMethod: 'TOWING',
      driverName: 'External Tow Truck',
      agreedPrice: 850.0,
      previousAdvanceDeduction: 0.0,
      cashToPay: 850.0,
      paymentStatus: 'PAID',
      paymentMethod: 'BANK_TRANSFER',
      vehicleModel: 'Nissan Navara 2.5M',
      engineIntact: true,
      gearboxPresent: false,
      catalyticConverter: true,
      alloyWheelsCount: 4,
      transportCompanyId: towingZafar.id,
      transportTripFee: 90.0,
      transportPaymentStatus: 'PAID'
    }
  });

  await prisma.purchase.create({
    data: {
      id: 'INV-2026-086',
      type: 'VEHICLE',
      date: new Date('2026-06-10T13:45:00Z'),
      supplierId: supplierLab.id,
      pickupLocation: 'Tutong Workshop Compound District',
      logisticsMethod: 'TOWING',
      driverName: 'External Tow Truck',
      agreedPrice: 300.0,
      previousAdvanceDeduction: 0.0,
      cashToPay: 300.0,
      paymentStatus: 'PAID',
      paymentMethod: 'CASH',
      vehicleModel: 'Honda Civic 1.8 Shell',
      engineIntact: false,
      gearboxPresent: false,
      catalyticConverter: false,
      alloyWheelsCount: 0,
      transportCompanyId: towingZafar.id,
      transportTripFee: 80.0,
      transportPaymentStatus: 'PAID'
    }
  });

  await prisma.purchase.create({
    data: {
      id: 'INV-2026-085',
      type: 'VEHICLE',
      date: new Date('2026-06-08T10:00:00Z'),
      supplierId: supplierAzri.id,
      pickupLocation: 'Bandar Seri Begawan Compound',
      logisticsMethod: 'HIAB',
      driverName: 'Zainal',
      agreedPrice: 650.0,
      previousAdvanceDeduction: 0.0,
      cashToPay: 650.0,
      paymentStatus: 'PAID',
      paymentMethod: 'CASH',
      vehicleModel: 'Mitsubishi Triton 2.5',
      engineIntact: true,
      gearboxPresent: true,
      catalyticConverter: false,
      alloyWheelsCount: 2,
      vehiclePhoto: '/uploads/triton_front.jpg',
      transportCompanyId: towingJaffer.id,
      transportTripFee: 75.0,
      transportPaymentStatus: 'UNPAID'
    }
  });

  await prisma.purchase.create({
    data: {
      id: 'INV-2026-083',
      type: 'VEHICLE',
      date: new Date('2026-06-05T08:30:00Z'),
      supplierId: supplierSeria.id,
      pickupLocation: 'Seria Industrial Zone',
      logisticsMethod: 'TOWING',
      driverName: 'External Tow',
      agreedPrice: 1200.0,
      previousAdvanceDeduction: 500.0,
      cashToPay: 700.0,
      paymentStatus: 'PARTIAL',
      paymentMethod: 'CASH',
      vehicleModel: 'Ford Ranger Wildtrak',
      engineIntact: true,
      gearboxPresent: true,
      catalyticConverter: true,
      alloyWheelsCount: 4,
      transportCompanyId: towingJune.id,
      transportTripFee: 100.0,
      transportPaymentStatus: 'UNPAID'
    }
  });

  await prisma.purchase.create({
    data: {
      id: 'TND-2026-042',
      type: 'MIXED_SCRAP',
      date: new Date('2026-06-15T15:10:00Z'),
      supplierId: supplierKbMetal.id,
      pickupLocation: 'Gadong Industrial Zone',
      logisticsMethod: 'HIAB',
      driverName: 'Zainal',
      agreedPrice: 4500.0,
      previousAdvanceDeduction: 0.0,
      cashToPay: 4500.0,
      paymentStatus: 'PARTIAL',
      paymentMethod: 'CASH',
      lotName: 'Mixed Scrap Metal Lot #3',
      scrapDescription: 'Heavy Industrial Radiators & Assorted Mixed Copper Scrap',
      scrapPhoto: '/uploads/scrap_lot_3.jpg',
      grossTonnageEstimate: 5.5
    }
  });

  await prisma.purchase.create({
    data: {
      id: 'TND-2026-040',
      type: 'MIXED_SCRAP',
      date: new Date('2026-06-12T14:00:00Z'),
      supplierId: supplierMaju.id,
      pickupLocation: 'Maju Engineering Yard, Kuala Belait',
      logisticsMethod: 'HIAB',
      driverName: 'Sufri',
      agreedPrice: 2800.0,
      previousAdvanceDeduction: 150.0,
      cashToPay: 2650.0,
      paymentStatus: 'PAID',
      paymentMethod: 'BANK_TRANSFER',
      lotName: 'Aluminium & Copper Lot #7',
      scrapDescription: 'Aluminium extrusions, copper bus bars, mixed electrical scrap',
      scrapPhoto: '/uploads/scrap_lot_7.jpg',
      grossTonnageEstimate: 3.2
    }
  });

  // ─── Cash Book ────────────────────────────────────────────────────────────────
  await prisma.cashBook.create({
    data: { type: 'OUT', category: 'PURCHASE', amount: 850.00, referenceId: 'INV-2026-088', description: 'Bank Transfer for Nissan Navara (Haji Mohammad)' }
  });
  await prisma.cashBook.create({
    data: { type: 'OUT', category: 'PURCHASE', amount: 300.00, referenceId: 'INV-2026-086', description: 'Cash payment for Honda Civic Shell (Syarikat LAB Ent.)' }
  });
  await prisma.cashBook.create({
    data: { type: 'OUT', category: 'PURCHASE', amount: 650.00, referenceId: 'INV-2026-085', description: 'Cash payment for Mitsubishi Triton (Azri Auto Parts)' }
  });
  await prisma.cashBook.create({
    data: { type: 'OUT', category: 'PURCHASE', amount: 2650.00, referenceId: 'TND-2026-040', description: 'Bank Transfer for Aluminium & Copper Lot #7 (Maju Engineering)' }
  });
  await prisma.cashBook.create({
    data: { type: 'OUT', category: 'ADVANCE', amount: 300.00, referenceId: supplierLab.id.toString(), description: 'Advance cash issued to Sufri (Syarikat LAB)' }
  });
  await prisma.cashBook.create({
    data: { type: 'OUT', category: 'ADVANCE', amount: 500.00, referenceId: supplierSeria.id.toString(), description: 'Advance cash issued to Seria Salvage Works' }
  });
  await prisma.cashBook.create({
    data: { type: 'OUT', category: 'ADVANCE', amount: 150.00, referenceId: supplierMaju.id.toString(), description: 'Advance cash issued to Maju Engineering' }
  });
  await prisma.cashBook.create({
    data: { type: 'OUT', category: 'TRANSPORT', amount: 90.00, referenceId: 'INV-2026-088', description: 'Towing fee settled — Zafar Towing (Navara run)' }
  });
  await prisma.cashBook.create({
    data: { type: 'OUT', category: 'TRANSPORT', amount: 80.00, referenceId: 'INV-2026-086', description: 'Towing fee settled — Zafar Towing (Civic run)' }
  });

  // ─── Sales ────────────────────────────────────────────────────────────────────
  const sale1 = await prisma.sale.create({
    data: {
      id: 'SAL-2026-001',
      date: new Date('2026-06-16T10:00:00Z'),
      customerId: customerMetalCorp.id,
      subtotal: 7880.0,
      grandTotal: 7880.0,
      paymentStatus: 'PAID',
      paymentReceived: 7880.0,
      balanceDue: 0.0
    }
  });
  await prisma.saleItem.createMany({
    data: [
      { saleId: sale1.id, product: 'Copper Wire', quantity: 500.0, unit: 'KG', price: 13.00, amount: 6500.0 },
      { saleId: sale1.id, product: 'Industrial Scrap Iron', quantity: 800.0, unit: 'KG', price: 0.45, amount: 360.0 },
      { saleId: sale1.id, product: 'Brass Fittings', quantity: 120.0, unit: 'KG', price: 8.50, amount: 1020.0 }
    ]
  });

  const sale2 = await prisma.sale.create({
    data: {
      id: 'SAL-2026-002',
      date: new Date('2026-06-14T09:00:00Z'),
      customerId: customerSengHong.id,
      subtotal: 3600.0,
      grandTotal: 3600.0,
      paymentStatus: 'PARTIAL',
      paymentReceived: 2000.0,
      balanceDue: 1600.0
    }
  });
  await prisma.saleItem.createMany({
    data: [
      { saleId: sale2.id, product: 'Heavy Melting Steel', quantity: 4000.0, unit: 'KG', price: 0.60, amount: 2400.0 },
      { saleId: sale2.id, product: 'Alloy Scraps', quantity: 200.0, unit: 'KG', price: 6.00, amount: 1200.0 }
    ]
  });

  const sale3 = await prisma.sale.create({
    data: {
      id: 'SAL-2026-003',
      date: new Date('2026-06-11T14:30:00Z'),
      customerId: customerBruneiSteel.id,
      subtotal: 5250.0,
      grandTotal: 5250.0,
      paymentStatus: 'PAID',
      paymentReceived: 5250.0,
      balanceDue: 0.0
    }
  });
  await prisma.saleItem.createMany({
    data: [
      { saleId: sale3.id, product: 'Copper Wire', quantity: 300.0, unit: 'KG', price: 13.00, amount: 3900.0 },
      { saleId: sale3.id, product: 'Lead Acid Battery Block', quantity: 150.0, unit: 'KG', price: 0.90, amount: 135.0 },
      { saleId: sale3.id, product: 'Brass Ingots', quantity: 150.0, unit: 'KG', price: 8.10, amount: 1215.0 }
    ]
  });

  const sale4 = await prisma.sale.create({
    data: {
      id: 'SAL-2026-004',
      date: new Date('2026-06-09T11:00:00Z'),
      customerId: customerKbRecycle.id,
      subtotal: 1800.0,
      grandTotal: 1800.0,
      paymentStatus: 'UNPAID',
      paymentReceived: 0.0,
      balanceDue: 1800.0
    }
  });
  await prisma.saleItem.createMany({
    data: [
      { saleId: sale4.id, product: 'Alloy Scraps', quantity: 300.0, unit: 'KG', price: 6.00, amount: 1800.0 }
    ]
  });

  // Cash Book — Sales
  await prisma.cashBook.create({
    data: { type: 'IN', category: 'SALE', amount: 7880.0, referenceId: 'SAL-2026-001', description: 'Full payment from MetalCorp Brunei — SAL-2026-001' }
  });
  await prisma.cashBook.create({
    data: { type: 'IN', category: 'SALE', amount: 2000.0, referenceId: 'SAL-2026-002', description: 'Partial deposit from Seng Hong Industry — SAL-2026-002' }
  });
  await prisma.cashBook.create({
    data: { type: 'IN', category: 'SALE', amount: 5250.0, referenceId: 'SAL-2026-003', description: 'Full payment from Brunei Steel Holdings — SAL-2026-003' }
  });

  // ─── Audit Logs ───────────────────────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      action: 'SYSTEM INITIALIZATION & MIGRATION SEEDING',
      performedBy: 'System Admin',
      details: 'Populated database with operational registries, ledger transactions, fleet assets, and sales invoices matching company specification sheets.'
    }
  });
  await prisma.auditLog.create({
    data: {
      action: 'PURCHASE RECORDED — INV-2026-089',
      performedBy: 'Manager',
      details: 'Toyota Hilux Double Cab acquired from Syarikat LAB Ent. via HIAB. Advance deduction of B$300 applied.'
    }
  });
  await prisma.auditLog.create({
    data: {
      action: 'SALE DISPATCHED — SAL-2026-001',
      performedBy: 'Manager',
      details: 'Wholesale dispatch to MetalCorp Brunei. 500KG Copper Wire, 800KG Iron, 120KG Brass. Total B$7,880 fully settled.'
    }
  });
  await prisma.auditLog.create({
    data: {
      action: 'ADVANCE ISSUED — Seria Salvage Works',
      performedBy: 'Manager',
      details: 'Cash advance of B$500 issued to Seria Salvage Works for upcoming Ford Ranger acquisition.'
    }
  });
  await prisma.auditLog.create({
    data: {
      action: 'FLEET COMPLIANCE ALERT — BA-1234',
      performedBy: 'System',
      details: 'Fuso HIAB Crane (BA-1234) inspection certificate expired. Insurance renewal due within 15 days. Immediate action required.'
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
