// client/src/utils/exifReader.js
import exifr from 'exifr';

function loadImageDimensions(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ naturalW: img.naturalWidth, naturalH: img.naturalHeight });
    img.onerror = () => resolve({ naturalW: 0, naturalH: 0 });
    img.src = src;
  });
}

export async function ingestPhotoMeta(file, src) {
  try {
    const [dims, exifData] = await Promise.all([
      loadImageDimensions(src),
      exifr.parse(file).catch(() => ({})), // Fallbacks cleanly if no EXIF exists
    ]);

    return {
      name: file.name,
      size: file.size,
      naturalW: dims.naturalW,
      naturalH: dims.naturalH,
      exif: exifData || {},
      status: 'ready',
    };
  } catch (err) {
    return {
      name: file.name,
      size: file.size,
      naturalW: 0,
      naturalH: 0,
      exif: {},
      status: 'ready',
    };
  }
}

export function createPhotoId() {
  return Math.random().toString(36).substring(2, 9);
}