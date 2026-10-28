import { RawParser } from './rawParser.js';

// Initialize the worker using Vite's native worker import syntax
const exifWorker = new Worker(new URL('./exifWorker.js', import.meta.url), {
  type: 'module',
});

function loadImageDimensions(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ naturalW: img.naturalWidth, naturalH: img.naturalHeight });
    img.onerror = () => resolve({ naturalW: 0, naturalH: 0 });
    img.src = src;
  });
}

function parseExifInWorker(file, isRaw = false, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const id = Math.random().toString(36).substring(2, 9);
    let timer = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      exifWorker.removeEventListener('message', messageHandler);
      exifWorker.removeEventListener('error', errorHandler);
    };

    const messageHandler = (e) => {
      if (e.data && e.data.id === id) {
        cleanup();
        resolve({
          exifData: e.data.exifData || {},
          previewBuffer: e.data.previewBuffer || null
        });
      }
    };

    const errorHandler = () => {
      cleanup();
      resolve({ exifData: {}, previewBuffer: null });
    };

    timer = setTimeout(() => {
      cleanup();
      resolve({ exifData: {}, previewBuffer: null });
    }, timeoutMs);

    exifWorker.addEventListener('message', messageHandler);
    exifWorker.addEventListener('error', errorHandler);
    exifWorker.postMessage({ file, id, isRaw });
  });
}

export async function ingestPhotoMeta(file, src) {
  try {
    const isRawFile = await RawParser.isRAW(file);
    
    const [dims, workerResult] = await Promise.all([
      loadImageDimensions(src),
      parseExifInWorker(file, isRawFile),
    ]);

    let finalSrc = src;
    let finalDims = dims;

    // Only for true unrenderable RAW formats (CR2, NEF, ARW, etc.):
    // upgrade to extracted embedded preview if present
    if (isRawFile && workerResult.previewBuffer) {
      try {
        const previewBlob = new Blob([workerResult.previewBuffer], { type: 'image/jpeg' });
        finalSrc = URL.createObjectURL(previewBlob);
        finalDims = await loadImageDimensions(finalSrc);
        // Revoke the unrendered raw blob url if it was replaced
        if (src && src !== finalSrc) {
          URL.revokeObjectURL(src);
        }
      } catch (_) {}
    }

    return {
      name: file.name,
      size: file.size,
      src: finalSrc,
      naturalW: finalDims.naturalW || dims.naturalW,
      naturalH: finalDims.naturalH || dims.naturalH,
      exif: workerResult.exifData || {},
      status: 'ready',
      isRaw: isRawFile
    };
  } catch (err) {
    return {
      name: file.name,
      size: file.size,
      naturalW: 0,
      naturalH: 0,
      exif: {},
      status: 'ready',
      isRaw: false
    };
  }
}

export function createPhotoId() {
  return Math.random().toString(36).substring(2, 9);
}