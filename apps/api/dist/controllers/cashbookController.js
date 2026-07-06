"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCashBookRecords = void 0;
const db_1 = require("@nur-afiq/db");
const getCashBookRecords = async (req, res) => {
    try {
        const records = await db_1.prisma.cashBook.findMany({
            orderBy: { date: 'desc' }
        });
        res.json(records);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getCashBookRecords = getCashBookRecords;
