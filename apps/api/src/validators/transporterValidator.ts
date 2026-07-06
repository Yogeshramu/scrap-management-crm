import { Request, Response, NextFunction } from 'express';

export const validateTransporterPayment = (req: Request, res: Response, next: NextFunction) => {
  const { paymentMethod, amountPaid, tripIds } = req.body;
  if (!paymentMethod || typeof paymentMethod !== 'string' || paymentMethod.trim() === '') {
    return res.status(400).json({ error: 'Payment method is required' });
  }
  if (amountPaid === undefined || isNaN(Number(amountPaid)) || Number(amountPaid) < 0) {
    return res.status(400).json({ error: 'Amount paid must be a non-negative number' });
  }
  if (!tripIds || !Array.isArray(tripIds) || tripIds.length === 0) {
    return res.status(400).json({ error: 'Please select trips to pay' });
  }
  next();
};
