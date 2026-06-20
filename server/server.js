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
  doc_id: { type: String, default: 'exifgrid_master' }, // Only 1 document will ever exist
  total_images: { type: Number, default: 0 },
  total_ai_runs: { type: Number, default: 0 },
  total_polaroids: { type: Number, default: 0 },
  total_csv_exports: { type: Number, default: 0 },
  min_aperture: { type: Number, default: 99.0 },
  max_aperture: { type: Number, default: 0.0 }
});

const GlobalStats = mongoose.model('GlobalStats', globalStatsSchema);

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
    let stats = await GlobalStats.findOne({ doc_id: 'exifgrid_master' });
    if (!stats) {
       // Return defaults if nobody has used the app yet
       stats = { total_images: 0, total_ai_runs: 0, total_polaroids: 0, total_csv_exports: 0, min_aperture: 0, max_aperture: 0 };
    }
    
    res.json({
      images: stats.total_images,
      ai: stats.total_ai_runs,
      polaroids: stats.total_polaroids,
      csv: stats.total_csv_exports,
      apertureRange: `f/${stats.min_aperture} - f/${stats.max_aperture}`
    });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// --- Existing Preference Routes ---
app.get('/api/settings/sync', (_req, res) => {
  res.json({ ok: true, preferences: null });
});

app.post('/api/settings/sync', (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ ok: false, error: 'Body must be a JSON object.' });
  }

  const forbiddenKeys = ['image', 'file', 'blob', 'dataUrl', 'base64', 'src'];
  for (const key of forbiddenKeys) {
    if (key in body) return res.status(400).json({ ok: false, error: `Key "${key}" not allowed.` });
  }

  const preferences = {
    theme: body.theme === 'light' || body.theme === 'dark' ? body.theme : 'dark',
    polaroid: {
      caption: typeof body.polaroid?.caption === 'string' ? body.polaroid.caption.slice(0, 40) : '',
      font: typeof body.polaroid?.font === 'string' ? body.polaroid.font : "'Caveat', cursive",
      exifToggles: Array.isArray(body.polaroid?.exifToggles)
        ? body.polaroid.exifToggles.filter((t) => ['camera', 'aperture', 'shutter', 'iso'].includes(t))
        : ['camera', 'aperture', 'shutter', 'iso'],
    },
    syncedAt: new Date().toISOString(),
  };

  res.json({ ok: true, preferences });
});

app.listen(PORT, () => {
  console.log(`ExifGrid API listening on http://localhost:${PORT}`);
});