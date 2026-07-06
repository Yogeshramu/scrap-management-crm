import { Request, Response, NextFunction } from 'express';

export const validateSupplier = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }
  next();
};
