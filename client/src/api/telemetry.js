import mongoose from 'mongoose';

// 1. Define the exact same schema you had in Express
const globalStatsSchema = new mongoose.Schema({
  doc_id: { type: String, default: 'exifgrid_master' },
  total_images: { type: Number, default: 0 }
});

// Prevent Mongoose from recompiling the model upon every function invocation
const GlobalStats = mongoose.models.GlobalStats || mongoose.model('GlobalStats', globalStatsSchema);

// 2. Cache the database connection
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
};

// 3. The Serverless Handler (Replaces app.post and app.get)
export default async function handler(req, res) {
  await connectDB();

  // POST: Increment the image count
  if (req.method === 'POST') {
    let { images = 0 } = req.body;
    
    if (!images || images <= 0) return res.status(204).send();
    if (images > 500) images = 500; // Rate limit

    try {
      await GlobalStats.findOneAndUpdate(
        { doc_id: 'exifgrid_master' },
        { $inc: { total_images: images } },
        { upsert: true, new: true }
      );
      return res.status(204).send();
    } catch (error) {
      console.error("Telemetry save failed", error);
      return res.status(500).json({ error: "Telemetry save failed" });
    }
  }

  // GET: Fetch the numbers
  if (req.method === 'GET') {
    try {
      const stats = await GlobalStats.findOne({ doc_id: 'exifgrid_master' });
      return res.status(200).json({ images: stats ? stats.total_images : 0 });
    } catch (error) {
      return res.status(500).json({ error: "Database error" });
    }
  }

  // Reject anything that isn't GET or POST
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}