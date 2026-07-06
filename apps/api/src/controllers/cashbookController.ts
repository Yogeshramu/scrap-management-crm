import { Request, Response } from 'express';
import { prisma } from '@nur-afiq/db';

export const getCashBookRecords = async (req: Request, res: Response) => {
  try {
    const records = await prisma.cashBook.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
