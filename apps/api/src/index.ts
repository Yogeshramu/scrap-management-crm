import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dashboardRoutes from './routes/dashboardRoutes';
import supplierRoutes from './routes/supplierRoutes';
import purchaseRoutes from './routes/purchaseRoutes';
import transporterRoutes from './routes/transporterRoutes';
import saleRoutes from './routes/saleRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import cashbookRoutes from './routes/cashbookRoutes';
import auditRoutes from './routes/auditRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    /\.vercel\.app$/,
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/transporters', transporterRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/cashbook', cashbookRoutes);
app.use('/api/auditlogs', auditRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
