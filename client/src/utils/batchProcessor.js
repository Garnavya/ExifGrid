import JSZip from 'jszip';
import { generatePolaroidDataURL } from './polaroid.js';
import { stripExifData } from './exifStripper.js';
import { getSolarPosition } from './sunCalc.js';

/**
 * Converts a base64 Data URL to a Blob for JSZip ingestion.
 */
function dataURLToBlob(dataURL) {
  const parts = dataURL.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Resolves the structured subfolder path based on EXIF routing rules.
 */
export function resolveSubfolder(photo, organizeBy) {
  const exif = photo?.exif || {};
  switch (organizeBy) {
    case 'date': {
      if (exif.DateTimeOriginal) {
        const dStr = String(exif.DateTimeOriginal).split(' ')[0].replace(/:/g, '-');
        if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) return dStr;
      }
      return 'Unknown_Date';
    }
    case 'camera': {
      const model = exif.Model || exif.Make;
      if (model) {
        return String(model).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      }
      return 'Unknown_Camera';
    }
    case 'focal': {
      let focal = exif.FocalLength;
      if (typeof focal === 'object' && focal.denominator) {
        focal = focal.numerator / focal.denominator;
      }
      if (focal) {
        return `${Math.round(Number(focal))}mm`;
      }
      return 'Unknown_FocalLength';
    }
    case 'iso': {
      const iso = Number(exif.ISO || exif.ISOSpeedRatings);
      if (!iso) return 'ISO_Unknown';
      if (iso <= 400) return 'ISO_100-400_LowNoise';
      if (iso <= 1600) return 'ISO_800-1600_Mid';
      if (iso <= 6400) return 'ISO_3200-6400_HighGain';
      return 'ISO_12800+_ExtremeLowLight';
    }
    case 'solar': {
      if (exif.DateTimeOriginal) {
        const parts = String(exif.DateTimeOriginal).split(' ');
        if (parts.length >= 2) {
          const date = new Date(`${parts[0].replace(/:/g, '-')}T${parts[1]}`);
          const solar = getSolarPosition(date, exif.latitude, exif.longitude);
          if (solar?.phaseName) return solar.phaseName.replace(/[^a-zA-Z0-9_-]/g, '_');
        }
      }
      return 'Ambient_Lighting';
    }
    default:
      return '';
  }
}

/**
 * Resolves the output filename with optional metadata slug prefixing.
 */
export function resolveFileName(photo, index, options = {}) {
  const nameParts = (photo?.name || `photo_${index + 1}`).split('.');
  const ext = nameParts.length > 1 ? nameParts.pop() : 'jpg';
  const baseName = nameParts.join('.');
  const exif = photo?.exif || {};

  let prefix = '';
  if (options.exportFormat === 'polaroid') prefix = 'Polaroid_';
  else if (options.exportFormat === 'scrubbed') prefix = 'Scrubbed_';

  let tag = '';
  if (options.renameFiles) {
    const dateTag = exif.DateTimeOriginal ? String(exif.DateTimeOriginal).split(' ')[0].replace(/:/g, '') + '_' : '';
    const cameraTag = exif.Model ? String(exif.Model).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8) + '_' : '';
    tag = `${dateTag}${cameraTag}`;
  }

  const outputExt = options.exportFormat === 'original' ? ext : 'jpg';
  return `${prefix}${tag}${baseName}.${outputExt}`;
}

/**
 * Generates an automated structured batch ZIP with folder routing and format transformation.
 * 
 * @param {Array} photos Array of photo objects
 * @param {Object} options Batch export settings
 * @param {Function} onProgress Progress callback (0-100)
 * @returns {Promise<Blob>} Structured ZIP blob
 */
export async function createStructuredBatchZip(photos, options = {}, onProgress) {
  if (!photos || photos.length === 0) return null;

  const zip = new JSZip();
  const rootFolderName = options.rootFolderName || 'ExifGrid_Organized_Export';
  const rootFolder = zip.folder(rootFolderName);

  const exportFormat = options.exportFormat || 'polaroid';
  const organizeBy = options.organizeBy || 'none';

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    try {
      let fileBlob = null;

      // 1. Generate payload according to selected export format
      if (exportFormat === 'polaroid') {
        const dataUrl = await generatePolaroidDataURL(photo, options);
        if (dataUrl) fileBlob = dataURLToBlob(dataUrl);
      } else if (exportFormat === 'scrubbed') {
        const res = await fetch(photo.src);
        const rawBlob = await res.blob();
        const fileObj = new File([rawBlob], photo.name, { type: rawBlob.type });
        fileBlob = await stripExifData(fileObj);
      } else {
        // Original files
        if (photo.file) {
          fileBlob = photo.file;
        } else {
          const res = await fetch(photo.src);
          fileBlob = await res.blob();
        }
      }

      if (!fileBlob) continue;

      // 2. Resolve target folder hierarchy
      const subfolder = resolveSubfolder(photo, organizeBy);
      const targetFolder = subfolder ? rootFolder.folder(subfolder) : rootFolder;

      // 3. Resolve target file name
      const fileName = resolveFileName(photo, i, options);
      targetFolder.file(fileName, fileBlob);

      if (onProgress) {
        onProgress(Math.round(((i + 1) / photos.length) * 50)); // Generation phase is first 50%
      }
    } catch (err) {
      console.error(`Failed to organize ${photo.name}`, err);
    }
  }

  // Compression phase is second 50%
  const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) {
      const overall = 50 + Math.round(metadata.percent * 0.5);
      onProgress(overall);
    }
  });

  return zipBlob;
}

/**
 * Backward compatibility wrapper for Polaroid batch ZIP.
 */
export async function createBatchPolaroidZip(photos, settings, onProgress) {
  return createStructuredBatchZip(photos, {
    ...settings,
    exportFormat: 'polaroid'
  }, onProgress);
}
