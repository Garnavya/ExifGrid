import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import telemetryRoutes from './routes/telemetryRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50kb' }));

// Routes
app.use('/api/telemetry', telemetryRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});