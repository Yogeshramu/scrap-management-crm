import { Router } from 'express';
import { getTransporters, getTransporterTrips, createTransporterPayment, updateTransporter } from '../controllers/transporterController';
import { validateTransporterPayment } from '../validators/transporterValidator';

const router = Router();

router.get('/', getTransporters);
router.put('/:id', updateTransporter);
router.get('/:id/trips', getTransporterTrips);
router.post('/:id/payments', validateTransporterPayment, createTransporterPayment);

export default router;
