"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSale = void 0;
const validateSale = (req, res, next) => {
    const { customerId, paymentStatus, products } = req.body;
    if (!customerId || isNaN(Number(customerId))) {
        return res.status(400).json({ error: 'Valid customerId is required' });
    }
    if (!paymentStatus || !['PAID', 'PARTIAL', 'UNPAID'].includes(paymentStatus)) {
        return res.status(400).json({ error: 'Payment status must be PAID, PARTIAL, or UNPAID' });
    }
    if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ error: 'Products must be a non-empty array' });
    }
    for (const item of products) {
        if (!item.product || typeof item.product !== 'string') {
            return res.status(400).json({ error: 'Product name must be a string' });
        }
        if (item.quantity === undefined || isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
            return res.status(400).json({ error: 'Product quantity must be a positive number' });
        }
        if (item.price === undefined || isNaN(Number(item.price)) || Number(item.price) < 0) {
            return res.status(400).json({ error: 'Product price must be a non-negative number' });
        }
    }
    next();
};
exports.validateSale = validateSale;
