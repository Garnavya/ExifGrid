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

// --- Global Telemetry Schema (Fixed Size) ---
const globalStatsSchema = new mongoose.Schema({
  doc_id: { type: String, default: 'exifgrid_master' },
  total_images: { type: Number, default: 0 }
});

const GlobalStats = mongoose.model('GlobalStats', globalStatsSchema);

// Remove ALL routes for /api/settings/sync below this point

// --- Telemetry Routes ---

// 1. POST: Increment counters safely
app.post('/api/telemetry', async (req, res) => {
  const { images = 0, ai = 0, polaroid = 0, csv = 0, apertures = [] } = req.body;

  try {
    const updatePayload = {
      $inc: {
        total_images: images,
        total_ai_runs: ai,
        total_polaroids: polaroid,
        total_csv_exports: csv
      }
    };

    // If apertures were sent, find the min and max of this specific batch
    if (apertures && apertures.length > 0) {
      const validApertures = apertures.filter(a => typeof a === 'number' && !isNaN(a));
      if (validApertures.length > 0) {
        updatePayload.$min = { min_aperture: Math.min(...validApertures) };
        updatePayload.$max = { max_aperture: Math.max(...validApertures) };
      }
    }

    // Upsert the single master document
    await GlobalStats.findOneAndUpdate(
      { doc_id: 'exifgrid_master' },
      updatePayload,
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
    
    // Only return the single permitted metric
    res.json({
      images: stats ? stats.total_images : 0
    });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});