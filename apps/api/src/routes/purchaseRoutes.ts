import { Router } from 'express';
import { getPurchases, createPurchase, updatePurchase } from '../controllers/purchaseController';
import { validatePurchase } from '../validators/purchaseValidator';

const router = Router();

router.get('/', getPurchases);
router.post('/', validatePurchase, createPurchase);
router.put('/:id', updatePurchase);

export default router;
