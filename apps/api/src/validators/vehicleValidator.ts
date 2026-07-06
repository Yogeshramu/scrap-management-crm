import { Request, Response, NextFunction } from 'express';

export const validateVehicle = (req: Request, res: Response, next: NextFunction) => {
  const { name, plateNumber, roadTaxExpiry, insuranceExpiry } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Vehicle name is required' });
  }
  if (!plateNumber || typeof plateNumber !== 'string' || plateNumber.trim() === '') {
    return res.status(400).json({ error: 'Plate number is required' });
  }
  if (!roadTaxExpiry || isNaN(Date.parse(roadTaxExpiry))) {
    return res.status(400).json({ error: 'Valid road tax expiry date is required' });
  }
  if (!insuranceExpiry || isNaN(Date.parse(insuranceExpiry))) {
    return res.status(400).json({ error: 'Valid insurance expiry date is required' });
  }
  next();
};

export const validateMaintenance = (req: Request, res: Response, next: NextFunction) => {
  const { date, service, cost } = req.body;
  if (!date || isNaN(Date.parse(date))) {
    return res.status(400).json({ error: 'Valid date is required' });
  }
  if (!service || typeof service !== 'string' || service.trim() === '') {
    return res.status(400).json({ error: 'Service description is required' });
  }
  if (cost === undefined || isNaN(Number(cost)) || Number(cost) < 0) {
    return res.status(400).json({ error: 'Cost must be a non-negative number' });
  }
  next();
};

export const validateFuel = (req: Request, res: Response, next: NextFunction) => {
  const { date, amount, cost } = req.body;
  if (!date || isNaN(Date.parse(date))) {
    return res.status(400).json({ error: 'Valid date is required' });
  }
  if (amount === undefined || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }
  if (cost === undefined || isNaN(Number(cost)) || Number(cost) < 0) {
    return res.status(400).json({ error: 'Cost must be a non-negative number' });
  }
  next();
};
