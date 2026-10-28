import GlobalStats from '../models/GlobalStats.js';
import mongoose from 'mongoose';

export const incrementTelemetry = async (req, res) => {
  // If database is not connected, gracefully respond 204
  if (mongoose.connection.readyState !== 1) {
    return res.status(204).send();
  }

  const rawImages = req.body?.images;
  
  // Abort if invalid or non-numeric
  if (typeof rawImages !== 'number' || !Number.isFinite(rawImages) || rawImages <= 0) {
    return res.status(204).send();
  }
  
  // Cap at 500 images per batch to prevent abuse and ensure integer
  const images = Math.min(Math.floor(rawImages), 500);
  
  try {
    await GlobalStats.findOneAndUpdate(
      { doc_id: 'exifgrid_master' },
      { $inc: { total_images: images } },
      { upsert: true, new: true }
    );
    return res.status(204).send();
  } catch (error) {
    console.error("Telemetry save failed:", error.message);
    return res.status(500).json({ error: "Telemetry update failed" });
  }
};

export const getTelemetry = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.json({ images: 0 });
  }

  try {
    const stats = await GlobalStats.findOne({ doc_id: 'exifgrid_master' });
    return res.json({
      images: stats ? stats.total_images : 0
    });
  } catch (err) {
    console.error("Telemetry get failed:", err.message);
    return res.status(500).json({ error: "Database error" });
  }
};