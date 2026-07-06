import { Request, Response } from 'express';
import { prisma } from '@nur-afiq/db';

async function generateNextSaleId() {
  const currentYear = new Date().getFullYear();
  const count = await prisma.sale.count();
  const nextNum = (count + 1).toString().padStart(3, '0');
  return `SAL-${currentYear}-${nextNum}`;
}

export const getSales = async (req: Request, res: Response) => {
  try {
    const list = await prisma.sale.findMany({
      include: {
        customer: true,
        products: true
      },
      orderBy: { date: 'desc' }
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createSale = async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      paymentStatus, // PAID, PARTIAL, UNPAID
      paymentReceived,
      customerBillPhoto,
      products // Array of { product: string, quantity: number, unit: string, price: number }
    } = req.body;

    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(customerId) }
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    // Calculate subtotal and grandTotal
    let subtotal = 0.0;
    const items = products.map((item: any) => {
      const q = parseFloat(item.quantity) || 0.0;
      const p = parseFloat(item.price) || 0.0;
      const amt = q * p;
      subtotal += amt;
      return {
        product: item.product,
        quantity: q,
        unit: item.unit || 'KG',
        price: p,
        amount: amt
      };
    });

    const grandTotal = subtotal;
    const received = paymentStatus === 'PAID' ? grandTotal : (parseFloat(paymentReceived) || 0.0);
    const balance = grandTotal - received;

    const saleId = await generateNextSaleId();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Sale Record
      const sale = await tx.sale.create({
        data: {
          id: saleId,
          customerId: customer.id,
          subtotal,
          grandTotal,
          paymentStatus,
          paymentReceived: received,
          balanceDue: balance,
          customerBillPhoto: customerBillPhoto || '',
          products: {
            create: items
          }
        },
        include: {
          products: true
        }
      });

      // 2. record inflow to CashBook if there is any received amount
      if (received > 0) {
        await tx.cashBook.create({
          data: {
            type: 'IN',
            category: 'SALE',
            amount: received,
            referenceId: saleId,
            description: `Sales revenue recorded for invoice ${saleId} (${customer.name})`
          }
        });
      }

      // 3. Logger
      await tx.auditLog.create({
        data: {
          action: `CREATED SALE INVOICE: ${saleId}`,
          performedBy: 'Manager',
          details: `Sold copper/steel to ${customer.name}. Grand Total: B$${grandTotal}. Received: B$${received}, Balance Due: B$${balance}.`
        }
      });

      return sale;
    });

    res.json(result);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
export const updateSale = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentReceived } = req.body;

    const existing = await prisma.sale.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Sale not found' });

    const received = paymentStatus === 'PAID' ? existing.grandTotal : (parseFloat(paymentReceived) || existing.paymentReceived);
    const balance = existing.grandTotal - received;

    const updated = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.update({
        where: { id },
        data: {
          paymentStatus: paymentStatus ?? existing.paymentStatus,
          paymentReceived: received,
          balanceDue: balance
        },
        include: { customer: true, products: true }
      });

      await tx.auditLog.create({
        data: {
          action: `UPDATED SALE: ${id}`,
          performedBy: 'Manager',
          details: `Edited sale ${id}. Payment status: ${paymentStatus ?? existing.paymentStatus}, Received: B$${received}.`
        }
      });

      return sale;
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, contact } = req.body;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Customer not found' });

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        contact: contact ?? existing.contact
      }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCustomers = async (req: Request, res: Response) => {
  try {
    const list = await prisma.customer.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { name, contact } = req.body;
    if (!name) return res.status(400).json({ error: 'Customer name is required' });

    const newCustomer = await prisma.customer.create({
      data: {
        name,
        contact: contact || ''
      }
    });

    await prisma.auditLog.create({
      data: {
        action: `ADDED CUSTOMER: ${name}`,
        performedBy: 'Manager',
        details: `Created customer card for ${name}`
      }
    });

    res.json(newCustomer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
