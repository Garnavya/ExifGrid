import { formatAperture, formatShutter, formatExifDate } from './formatters.js';

export async function generatePolaroidDataURL(photo, settings = {}) {
  if (!photo?.src) return null;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.src = photo.src;
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
  });

  const MAX_WIDTH = 1920;
  let imgWidth = img.width;
  let imgHeight = img.height;

  if (imgWidth > MAX_WIDTH) {
    const scaleFactor = MAX_WIDTH / imgWidth;
    imgWidth = MAX_WIDTH;
    imgHeight = Math.round(imgHeight * scaleFactor);
  }

  const baseSize = Math.max(imgWidth, imgHeight);
  const frameThick = Math.round(imgWidth * 0.06);
  const bottomThick = Math.round(baseSize * 0.16);
  const popBorder = Math.max(4, Math.round(imgWidth * 0.015));

  canvas.width = imgWidth + frameThick * 2;
  canvas.height = imgHeight + frameThick + bottomThick;

  ctx.fillStyle = '#F8F8F8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const recessX = frameThick - popBorder;
  const recessY = frameThick - popBorder;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = Math.round(imgWidth * 0.02);
  ctx.shadowOffsetY = Math.round(imgWidth * 0.01);
  ctx.fillStyle = '#E0E0E0';
  ctx.fillRect(recessX, recessY, imgWidth + popBorder * 2, imgHeight + popBorder * 2);

  ctx.shadowColor = 'transparent';
  ctx.drawImage(img, frameThick, frameThick, imgWidth, imgHeight);
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.lineWidth = Math.max(1, Math.round(imgWidth * 0.001));
  ctx.strokeRect(frameThick, frameThick, imgWidth, imgHeight);

  const bottomFrameTop = frameThick + imgHeight + popBorder;
  const exif = photo.exif || {};
  const exifParts = [];

  // Strictly map exactly what the user selected to prevent hardcoded overrides
  settings.exifToggles?.forEach(key => {
    if (key === 'Model' && exif.Model) exifParts.push(`📸 ${exif.Model}`);
    else if (key === 'Make' && exif.Make) exifParts.push(exif.Make);
    else if (key === 'FNumber' && exif.FNumber) exifParts.push(formatAperture(exif.FNumber));
    else if (key === 'ExposureTime' && exif.ExposureTime) exifParts.push(formatShutter(exif.ExposureTime));
    else if (key === 'ISOSpeedRatings' && exif.ISOSpeedRatings) exifParts.push(`ISO ${exif.ISOSpeedRatings}`);
    else if (key === 'ISO' && exif.ISO) exifParts.push(`ISO ${exif.ISO}`);
    else if (key === 'FocalLength' && exif.FocalLength) exifParts.push(`${Number(exif.FocalLength).toFixed(0)}mm`);
    else if (key === 'DateTimeOriginal' && exif.DateTimeOriginal) exifParts.push(formatExifDate(exif.DateTimeOriginal.toString()));
    else if (key === 'GPS' && exif.latitude !== undefined && exif.longitude !== undefined) {
      exifParts.push(`${exif.latitude.toFixed(5)}°, ${exif.longitude.toFixed(5)}°`);
    } else if (exif[key]) {
      const val = String(exif[key]).trim();
      if (val) exifParts.push(val.length > 25 ? `${val.substring(0, 25)}...` : val);
    }
  });

  const exifStr = exifParts.join('  |  ');

  if (settings.caption) {
    let capSize = Math.max(40, Math.round(baseSize * 0.035));
    if (settings.font?.includes('Caveat')) capSize = Math.round(capSize * 1.5);
    ctx.font = `${capSize}px ${settings.font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const capY = exifStr
      ? bottomFrameTop + bottomThick * 0.4
      : bottomFrameTop + bottomThick * 0.5;
    ctx.fillStyle = '#111111';
    ctx.fillText(settings.caption, canvas.width / 2, capY);
  }

  if (exifStr) {
    // Apply user scale multiplier (default 1.0)
    const userScale = settings.exifTextScale || 1.0;
    const baseExifSize = Math.max(26, Math.round(baseSize * 0.024)) * userScale;
    
    const weight = settings.exifBold ? 'bold' : 'normal';
    const style = settings.exifItalic ? 'italic' : 'normal';
    
    ctx.font = `${style} ${weight} ${baseExifSize}px monospace`;
    
    let currentSize = baseExifSize;
    let textWidth = ctx.measureText(exifStr).width;
    const maxTextWidth = canvas.width * 0.92; 
    
    while(textWidth > maxTextWidth && currentSize > 12) {
      currentSize -= 1;
      ctx.font = `${style} ${weight} ${currentSize}px monospace`;
      textWidth = ctx.measureText(exifStr).width;
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const exifY = settings.caption
      ? bottomFrameTop + bottomThick * 0.75
      : bottomFrameTop + bottomThick * 0.5;
    ctx.fillStyle = '#555555';
    ctx.fillText(exifStr, canvas.width / 2, exifY);
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}

export async function downloadPolaroid(photo, settings) {
  const dataUrl = await generatePolaroidDataURL(photo, settings);
  if (!dataUrl) return;

  const link = document.createElement('a');
  link.download = `ExifGrid-Polaroid-${photo.id}.jpg`;
  link.href = dataUrl;
  link.click();
}