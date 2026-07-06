import { Router } from 'express';
import { getSales, createSale, updateSale, getCustomers, createCustomer, updateCustomer } from '../controllers/saleController';
import { validateSale } from '../validators/saleValidator';

const router = Router();

router.get('/', getSales);
router.post('/', validateSale, createSale);
router.put('/:id', updateSale);
router.get('/customers', getCustomers);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);

export default router;
