"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSupplier = void 0;
const validateSupplier = (req, res, next) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Name is required' });
    }
    next();
};
exports.validateSupplier = validateSupplier;
