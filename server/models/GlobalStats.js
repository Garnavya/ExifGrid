import mongoose from 'mongoose';

const globalStatsSchema = new mongoose.Schema({
  doc_id: { type: String, default: 'exifgrid_master' },
  total_images: { type: Number, default: 0 }
});

export default mongoose.model('GlobalStats', globalStatsSchema);