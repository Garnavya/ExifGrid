/**
 * ExifGrid v3 — Express API with MongoDB Telemetry
 */
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '32kb' }));

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

// --- Global Telemetry Schema (Strict Image Count Only) ---
const globalStatsSchema = new mongoose.Schema({
  doc_id: { type: String, default: 'exifgrid_master' },
  total_images: { type: Number, default: 0 }
});
const GlobalStats = mongoose.model('GlobalStats', globalStatsSchema);

// --- Telemetry Routes ---
// 1. POST: Increment counters safely
app.post('/api/telemetry', async (req, res) => {
  let { images = 0 } = req.body;
  
  // Abort if the payload is invalid or empty
  if (!images || images <= 0) return res.status(204).send();

  // Rate Limiting / Sanity Check: Cap at 500 images per batch to prevent abuse
  if (images > 500) images = 500;

  try {
    await GlobalStats.findOneAndUpdate(
      { doc_id: 'exifgrid_master' },
      { $inc: { total_images: images } },
      { upsert: true, new: true }
    );
    
    res.status(204).send();
  } catch (error) {
    console.error("Telemetry save failed", error);
    res.status(500).send();
  }
});

// 2. GET: Fetch the numbers for the frontend
app.get('/api/telemetry', async (req, res) => {
  try {
    const stats = await GlobalStats.findOne({ doc_id: 'exifgrid_master' });
    res.json({
      images: stats ? stats.total_images : 0
    });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});