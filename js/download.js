import { photos } from './state.js';

// EXPORT 1: Generates the Data URL for Live Preview OR Download
export async function generatePolaroidDataURL(photoId, settings = {}) {
  const photo = photos.find(p => p.id === photoId);
  if (!photo) return null;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.src = photo.src;
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

  const MAX_WIDTH = 1920;
  let imgWidth = img.width;
  let imgHeight = img.height;

  if (imgWidth > MAX_WIDTH) {
    const scaleFactor = MAX_WIDTH / imgWidth;
    imgWidth = MAX_WIDTH;
    imgHeight = Math.round(imgHeight * scaleFactor);
  }

  // ── POLAROID DESIGN MATH (Fixed for Vertical Images) ──
  // We use the LONGEST side of the image (baseSize) to calculate the bottom thickness. 
  // This prevents the bottom frame from shrinking on tall portrait photos.
  const baseSize = Math.max(imgWidth, imgHeight);

  const frameThick = Math.round(imgWidth * 0.06); // Sides still look best tied to width
  const bottomThick = Math.round(baseSize * 0.16); // Bottom tied to baseSize so text always fits
  const popBorder = Math.max(4, Math.round(imgWidth * 0.015));

  canvas.width = imgWidth + (frameThick * 2);
  canvas.height = imgHeight + frameThick + bottomThick;

  // Base & Border
  ctx.fillStyle = "#F8F8F8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const recessX = frameThick - popBorder;
  const recessY = frameThick - popBorder;
  ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
  ctx.shadowBlur = Math.round(imgWidth * 0.02);
  ctx.shadowOffsetY = Math.round(imgWidth * 0.01);
  ctx.fillStyle = "#E0E0E0"; 
  ctx.fillRect(recessX, recessY, imgWidth + (popBorder * 2), imgHeight + (popBorder * 2));
  
  ctx.shadowColor = "transparent";
  ctx.drawImage(img, frameThick, frameThick, imgWidth, imgHeight);
  ctx.strokeStyle = "rgba(0,0,0,0.8)";
  ctx.lineWidth = Math.max(1, Math.round(imgWidth * 0.001));
  ctx.strokeRect(frameThick, frameThick, imgWidth, imgHeight);

  // ── TYPOGRAPHY FIXES ──
  const bottomFrameTop = frameThick + imgHeight + popBorder;
  ctx.fillStyle = "#111111";

  // Build EXIF String based on checkboxes
  const exif = photo.exif || {};
  let exifParts = [];
  if (settings.exifToggles?.includes('camera') && exif.Model) exifParts.push(`📸 ${exif.Model}`);
  if (settings.exifToggles?.includes('aperture') && exif.FNumber) exifParts.push(`f/${exif.FNumber}`);
  if (settings.exifToggles?.includes('shutter') && exif.ExposureTime) exifParts.push(`1/${Math.round(1/exif.ExposureTime)}s`);
  if (settings.exifToggles?.includes('iso') && exif.ISOSpeedRatings) exifParts.push(`ISO ${exif.ISOSpeedRatings}`);
  
  const exifStr = exifParts.join('  |  ');

  // Draw Caption
  if (settings.caption) {
    // Calculate font size using baseSize
    let capSize = Math.max(40, Math.round(baseSize * 0.035));
    if (settings.font.includes('Caveat')) capSize = Math.round(capSize * 1.5); 
    ctx.font = `${capSize}px ${settings.font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const capY = exifStr ? bottomFrameTop + (bottomThick * 0.4) : bottomFrameTop + (bottomThick * 0.5);
    ctx.fillText(settings.caption, canvas.width / 2, capY);
  }

  // Draw EXIF (Larger and cleaner)
  if (exifStr) {
    // Calculate font size using baseSize
    const exifSize = Math.max(20, Math.round(baseSize * 0.018)); 
    
    ctx.font = `bold ${exifSize}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Slightly adjusted Y-positioning for perfect vertical centering
    const exifY = settings.caption ? bottomFrameTop + (bottomThick * 0.75) : bottomFrameTop + (bottomThick * 0.5);
    
    ctx.fillStyle = "#555555";
    ctx.fillText(exifStr, canvas.width / 2, exifY);
  }

  return canvas.toDataURL('image/jpeg', 0.90);
}

// EXPORT 2: The actual download trigger
export async function downloadPolaroid(photoId, settings) {
  const dataUrl = await generatePolaroidDataURL(photoId, settings);
  if (!dataUrl) return;
  const link = document.createElement('a');
  link.download = `ExifGrid-Polaroid-${photoId}.jpg`;
  link.href = dataUrl;
  link.click();
}