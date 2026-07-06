import { Router } from 'express';
import { getCashBookRecords } from '../controllers/cashbookController';

const router = Router();

router.get('/', getCashBookRecords);

export default router;
