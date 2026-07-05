import GlobalStats from '../models/GlobalStats.js';

export const incrementTelemetry = async (req, res) => {
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
};

export const getTelemetry = async (req, res) => {
  try {
    const stats = await GlobalStats.findOne({ doc_id: 'exifgrid_master' });
    res.json({
      images: stats ? stats.total_images : 0
    });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
};