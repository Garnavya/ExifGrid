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

function parseExifInWorker(file, timeoutMs = 8000) {
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
        resolve(e.data.exifData || {});
      }
    };

    const errorHandler = () => {
      cleanup();
      resolve({});
    };

    timer = setTimeout(() => {
      cleanup();
      resolve({});
    }, timeoutMs);

    exifWorker.addEventListener('message', messageHandler);
    exifWorker.addEventListener('error', errorHandler);
    exifWorker.postMessage({ file, id });
  });
}

export async function ingestPhotoMeta(file, src) {
  try {
    const isRawFile = await RawParser.isRAW(file);
    
    // In future iterations, swap exifr for a dedicated WASM raw parser here if needed[cite: 2]
    const [dims, exifData] = await Promise.all([
      loadImageDimensions(src),
      parseExifInWorker(file),
    ]);

    return {
      name: file.name,
      size: file.size,
      naturalW: dims.naturalW,
      naturalH: dims.naturalH,
      exif: exifData || {},
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