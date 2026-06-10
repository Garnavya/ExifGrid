/**
 * EXIF ingestion migrated from vanilla readExif().
 *
 * Vanilla: pushed to global `photos[]`, replaced DOM placeholder with buildCard().
 * React:    returns a Promise<PhotoPatch> that App merges into state via setPhotos.
 */
import EXIF from 'exif-js';

function loadImageDimensions(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ naturalW: img.naturalWidth, naturalH: img.naturalHeight });
    img.onerror = () => resolve({ naturalW: 0, naturalH: 0 });
    img.src = src;
  });
}

function readExifTags(file) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (tags) => {
      if (settled) return;
      settled = true;
      resolve(tags);
    };

    try {
      EXIF.getData(file, function onExifReady() {
        try {
          finish(EXIF.getAllTags(this) || {});
        } catch {
          finish({});
        }
      });
    } catch {
      finish({});
    }

    setTimeout(() => finish({}), 1200);
  });
}

/**
 * @param {File} file
 * @param {string} src - Object URL
 * @returns {Promise<{ name, size, naturalW, naturalH, exif, status }>}
 */
export async function ingestPhotoMeta(file, src) {
  const [dims, exif] = await Promise.all([
    loadImageDimensions(src),
    readExifTags(file),
  ]);

  return {
    name: file.name,
    size: file.size,
    naturalW: dims.naturalW,
    naturalH: dims.naturalH,
    exif,
    status: 'ready',
  };
}

export function createPhotoId() {
  return Math.random().toString(36).substring(2, 9);
}
