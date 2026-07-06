import { Router } from 'express';
import { getVehicles, createVehicle, updateVehicle, addVehicleMaintenance, addVehicleFuel } from '../controllers/vehicleController';
import { validateVehicle, validateMaintenance, validateFuel } from '../validators/vehicleValidator';

const router = Router();

router.get('/', getVehicles);
router.post('/', validateVehicle, createVehicle);
router.put('/:id', updateVehicle);
router.post('/:id/maintenance', validateMaintenance, addVehicleMaintenance);
router.post('/:id/fuel', validateFuel, addVehicleFuel);

export default router;
