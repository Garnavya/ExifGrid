import exifr from 'exifr';

self.onmessage = async (e) => {
  const { file, id, isRaw } = e.data;
  try {
    // Parse the EXIF metadata
    const exifData = await exifr.parse(file);

    // Only extract embedded thumbnail/preview if the file is an unrenderable RAW format
    let previewBuffer = null;
    if (isRaw) {
      try {
        const thumb = await exifr.thumbnail(file);
        if (thumb && thumb.byteLength > 0) {
          previewBuffer = thumb;
        }
      } catch (_) {}
    }

    self.postMessage(
      { id, success: true, exifData: exifData || {}, previewBuffer },
      previewBuffer ? [previewBuffer.buffer] : []
    );
  } catch (error) {
    // Fallback if no EXIF exists or parsing fails
    self.postMessage({ id, success: false, exifData: {}, previewBuffer: null });
  }
};