"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const supplierRoutes_1 = __importDefault(require("./routes/supplierRoutes"));
const purchaseRoutes_1 = __importDefault(require("./routes/purchaseRoutes"));
const transporterRoutes_1 = __importDefault(require("./routes/transporterRoutes"));
const saleRoutes_1 = __importDefault(require("./routes/saleRoutes"));
const vehicleRoutes_1 = __importDefault(require("./routes/vehicleRoutes"));
const cashbookRoutes_1 = __importDefault(require("./routes/cashbookRoutes"));
const auditRoutes_1 = __importDefault(require("./routes/auditRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/dashboard', dashboardRoutes_1.default);
app.use('/api/suppliers', supplierRoutes_1.default);
app.use('/api/purchases', purchaseRoutes_1.default);
app.use('/api/transporters', transporterRoutes_1.default);
app.use('/api/sales', saleRoutes_1.default);
app.use('/api/vehicles', vehicleRoutes_1.default);
app.use('/api/cashbook', cashbookRoutes_1.default);
app.use('/api/auditlogs', auditRoutes_1.default);
// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
