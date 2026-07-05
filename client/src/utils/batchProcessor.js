import JSZip from 'jszip';
import { generatePolaroidDataURL } from './polaroid.js';

// Helper to convert base64 Data URL to a Blob for JSZip
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

export async function createBatchPolaroidZip(photos, settings, onProgress) {
  if (!photos || photos.length === 0) return null;

  const zip = new JSZip();
  const folder = zip.folder("ExifGrid_Polaroids");

  // Step 1: Generate Polaroids and queue into zip
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    try {
      // Pass the global user settings (exifToggles, caption) into the generator
      const dataUrl = await generatePolaroidDataURL(photo, settings);
      if (!dataUrl) continue;

      const blob = dataURLToBlob(dataUrl);
      
      // Clean up the filename extension to always be .jpg
      const nameParts = photo.name.split('.');
      nameParts.pop(); 
      const baseName = nameParts.join('.');
      const fileName = `Polaroid_${i + 1}_${baseName}.jpg`;
      
      folder.file(fileName, blob);
    } catch (err) {
      console.error(`Failed to process ${photo.name}`, err);
    }
  }

  // Step 2: Compress asynchronously and report progress
  const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) {
      onProgress(metadata.percent.toFixed(0));
    }
  });

  // Step 3: Trigger the local download
  const downloadUrl = URL.createObjectURL(zipBlob);
  link.href = downloadUrl;
  link.download = `ExifGrid_Polaroids_${new Date().getTime()}.zip`;
  document.body.appendChild(link); // Required for Firefox
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);

  return zipBlob;
}