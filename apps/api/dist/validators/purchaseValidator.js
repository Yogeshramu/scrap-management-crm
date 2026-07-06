"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePurchase = void 0;
const validatePurchase = (req, res, next) => {
    const { type, supplierId, pickupLocation, logisticsMethod, agreedPrice } = req.body;
    if (!type || !['VEHICLE', 'MIXED_SCRAP'].includes(type)) {
        return res.status(400).json({ error: 'Type must be VEHICLE or MIXED_SCRAP' });
    }
    if (!supplierId || isNaN(Number(supplierId))) {
        return res.status(400).json({ error: 'Valid supplierId is required' });
    }
    if (!pickupLocation || typeof pickupLocation !== 'string' || pickupLocation.trim() === '') {
        return res.status(400).json({ error: 'Pickup location is required' });
    }
    if (!logisticsMethod || !['HIAB', 'TOWING', 'COMPANY_VEHICLE'].includes(logisticsMethod)) {
        return res.status(400).json({ error: 'Logistics method must be HIAB, TOWING, or COMPANY_VEHICLE' });
    }
    if (agreedPrice === undefined || isNaN(Number(agreedPrice)) || Number(agreedPrice) < 0) {
        return res.status(400).json({ error: 'Agreed price must be a non-negative number' });
    }
    next();
};
exports.validatePurchase = validatePurchase;
