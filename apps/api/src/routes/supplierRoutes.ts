import { Router } from 'express';
import { getSuppliers, createSupplier, updateSupplier } from '../controllers/supplierController';
import { validateSupplier } from '../validators/supplierValidator';

const router = Router();

router.get('/', getSuppliers);
router.post('/', validateSupplier, createSupplier);
router.put('/:id', updateSupplier);

export default router;
