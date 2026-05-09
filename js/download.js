// js/download.js
import { photos } from './state.js'; 

export async function downloadPolaroid(photoId) {
  const photo = photos.find(p => p.id === photoId);
  if (!photo) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Load the image safely
  const img = new Image();
  img.src = photo.src;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  // ─── NEW: RESOLUTION SCALING LOGIC ─────────────────────────────────────────
  // We cap the image width to 1920px (Standard HD). 
  // If a photo is 6000px wide, this prevents the canvas from becoming a 25MB monster.
  const MAX_WIDTH = 1920;
  let imgWidth = img.width;
  let imgHeight = img.height;

  // If the uploaded image is larger than our cap, mathematically scale it down
  // while preserving the exact aspect ratio.
  if (imgWidth > MAX_WIDTH) {
    const scaleFactor = MAX_WIDTH / imgWidth;
    imgWidth = MAX_WIDTH;
    imgHeight = Math.round(imgHeight * scaleFactor);
  }
  // ───────────────────────────────────────────────────────────────────────────

  // ── POLAROID DESIGN MATH (Now using the scaled dimensions) ──
  const frameThick = Math.round(imgWidth * 0.08); // Thick top and sides
  const bottomThick = Math.round(imgWidth * 0.22); // Fat bottom for text
  const popBorder = Math.max(4, Math.round(imgWidth * 0.015)); // The separation gap

  canvas.width = imgWidth + (frameThick * 2);
  canvas.height = imgHeight + frameThick + bottomThick;

  // 1. Paint the Polaroid Base (Slightly off-white)
  ctx.fillStyle = "#F8F8F8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. The "Popping Border" (Dark recess behind the photo)
  const recessX = frameThick - popBorder;
  const recessY = frameThick - popBorder;
  const recessW = imgWidth + (popBorder * 2);
  const recessH = imgHeight + (popBorder * 2);

  // Apply shadow to make the recess look deep
  ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
  ctx.shadowBlur = Math.round(imgWidth * 0.02);
  ctx.shadowOffsetY = Math.round(imgWidth * 0.01);
  ctx.fillStyle = "#E0E0E0"; 
  ctx.fillRect(recessX, recessY, recessW, recessH);

  // Clear shadow before drawing the actual photo
  ctx.shadowColor = "transparent";

  // 3. Draw the Actual Photo (Using scaled dimensions)
  ctx.drawImage(img, frameThick, frameThick, imgWidth, imgHeight);

  // Add a razor-thin dark stroke around the photo edge for crispness
  ctx.strokeStyle = "rgba(0,0,0,0.8)";
  ctx.lineWidth = Math.max(1, Math.round(imgWidth * 0.001)); // Scale line width too
  ctx.strokeRect(frameThick, frameThick, imgWidth, imgHeight);

  // 4. Draw EXIF Text on the Bottom Frame
  const exif = photo.exif || {};
  const camera = exif.Model || "Unknown Camera";
  const aperture = exif.FNumber ? `f/${exif.FNumber}` : 'f/--';
  const shutter = exif.ExposureTime ? `1/${Math.round(1/exif.ExposureTime)}s` : '--s';
  const iso = exif.ISOSpeedRatings ? `ISO ${exif.ISOSpeedRatings}` : 'ISO --';

  const fontSize = Math.max(20, Math.round(imgWidth * 0.03));
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textBaseline = "middle";
  
  const textY = frameThick + imgHeight + popBorder + (bottomThick / 2);

  // Left text (Black)
  ctx.fillStyle = "#111111";
  ctx.textAlign = "left";
  ctx.fillText(`📸 ${camera}`, frameThick, textY);

  // Right text (Dark Grey)
  ctx.fillStyle = "#555555";
  ctx.textAlign = "right";
  ctx.fillText(`${aperture} | ${shutter} | ${iso}`, canvas.width - frameThick, textY);

  // 5. Trigger the Download
  const link = document.createElement('a');
  
  // ─── NEW: EXPORT COMPRESSION LOGIC ──────────────────────────────────────────
  // Change filename to .jpg
  link.download = `ExifGrid-Polaroid-${photo.id}.jpg`;
  
  // Switch toDataURL format to 'image/jpeg' and set quality to 0.90 (90%)
  // This introduces highly efficient, virtually invisible compression.
  link.href = canvas.toDataURL('image/jpeg', 0.90);
  // ───────────────────────────────────────────────────────────────────────────
  
  link.click();
}