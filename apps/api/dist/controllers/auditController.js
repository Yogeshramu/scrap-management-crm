"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = void 0;
const db_1 = require("@nur-afiq/db");
const getAuditLogs = async (req, res) => {
    try {
        const logs = await db_1.prisma.auditLog.findMany({
            orderBy: { timestamp: 'desc' }
        });
        res.json(logs);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getAuditLogs = getAuditLogs;
