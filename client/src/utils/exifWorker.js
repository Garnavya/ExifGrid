import exifr from 'exifr';

self.onmessage = async (e) => {
  const { file, id } = e.data;
  try {
    // Parse the EXIF data
    const exifData = await exifr.parse(file);
    self.postMessage({ id, success: true, exifData: exifData || {} });
  } catch (error) {
    // Fallback if no EXIF exists or parsing fails
    self.postMessage({ id, success: false, exifData: {} });
  }
};