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

// --- Telemetry Schema ---
const telemetrySchema = new mongoose.Schema({
  category: String, // 'camera', 'focalLength', or 'global'
  label: String,    // e.g., 'Canon EOS 1200D', '50mm', or 'total_processed'
  count: { type: Number, default: 0 }
});

const Telemetry = mongoose.model('Telemetry', telemetrySchema);

// --- Telemetry Routes ---

// 1. POST: Accept a batched array and sanitize inputs
app.post('/api/telemetry', async (req, res) => {
  // Extract the array we created in the frontend
  const { batch } = req.body;
  
  // If there's no batch array, reject the request early
  if (!batch || !Array.isArray(batch)) return res.status(400).send();

  try {
    const operations = [];

    // Increment the global "total_processed" by the exact length of the batch array
    if (batch.length > 0) {
      operations.push(Telemetry.updateOne(
        { category: 'global', label: 'total_processed' },
        { $inc: { count: batch.length } },
        { upsert: true }
      ));
    }

    // Loop through every item in the batch
    for (const item of batch) {
      // THE SANITIZER: Force it to be a string, and strictly slice to 50 characters
      const safeCamera = item.camera ? String(item.camera).slice(0, 50).trim() : null;
      const safeFocal = item.focalLength ? String(item.focalLength).slice(0, 50).trim() : null;

      // Queue the Camera increment
      if (safeCamera && safeCamera !== 'Unknown Camera') {
        operations.push(Telemetry.updateOne(
          { category: 'camera', label: safeCamera },
          { $inc: { count: 1 } },
          { upsert: true }
        ));
      }

      // Queue the Focal Length increment
      if (safeFocal && safeFocal !== 'Unknown Lens') {
        operations.push(Telemetry.updateOne(
          { category: 'focalLength', label: safeFocal },
          { $inc: { count: 1 } },
          { upsert: true }
        ));
      }
    }

    // Execute all database hits at the exact same time
    if (operations.length > 0) await Promise.all(operations);
    
    res.status(204).send();
  } catch (error) {
    console.error("Telemetry batch save failed", error);
    res.status(500).send();
  }
});

// 2. GET: Instant Dashboard Retrieval (No heavy math required anymore!)
app.get('/api/telemetry', async (req, res) => {
  try {
    // Fetch pre-sorted top 5s directly
    const topCameras = await Telemetry.find({ category: 'camera' }).sort({ count: -1 }).limit(5);
    const topFocals = await Telemetry.find({ category: 'focalLength' }).sort({ count: -1 }).limit(5);
    const globalTotal = await Telemetry.findOne({ category: 'global', label: 'total_processed' });

    // Format for the React Dashboard
    const cameras = {};
    topCameras.forEach(doc => cameras[doc.label] = doc.count);

    const focalLengths = {};
    topFocals.forEach(doc => focalLengths[doc.label] = doc.count);

    res.json({ 
      totalProcessed: globalTotal ? globalTotal.count : 0, 
      cameras, 
      focalLengths 
    });

  } catch (err) {
    console.error("Dashboard fetch failed", err);
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