import { formatAperture, formatShutter, formatExifDate } from './formatters.js';

/**
 * Visual EXIF Watermarking & Brand Stamp Suite.
 * 
 * Generates minimalist Leica-style bottom letterbox stamps,
 * matte obsidian cinematic bars, and floating glass metadata badges.
 * Preserves high image quality with vector typography.
 */

export const WATERMARK_STYLES = {
  LEICA_WHITE: 'leica_white',
  OBSIDIAN_BLACK: 'obsidian_black',
  FLOATING_GLASS: 'floating_glass',
  HASSELBLAD_BORDER: 'hasselblad_border'
};

/**
 * Helper to draw a rounded rectangle.
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

/**
 * Generates a watermarked image as a Canvas DataURL.
 * 
 * @param {Object} photo Photo object containing src and exif
 * @param {Object} options Customization options
 * @returns {Promise<string>} Output data URL (JPEG)
 */
export async function generateWatermarkDataURL(photo, options = {}) {
  if (!photo?.src) return null;

  const style = options.style || WATERMARK_STYLES.LEICA_WHITE;
  const exif = photo.exif || {};

  // Load image
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = photo.src;
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
  });

  const MAX_WIDTH = 2560;
  let imgW = img.width;
  let imgH = img.height;
  if (imgW > MAX_WIDTH) {
    const scaleFactor = MAX_WIDTH / imgW;
    imgW = MAX_WIDTH;
    imgH = Math.round(imgH * scaleFactor);
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Text values
  const cameraModel = (options.cameraModel || exif.Model || exif.Make || 'PRO OPTICS').trim().toUpperCase();
  const artistName = (options.artist || exif.Artist || options.caption || '').trim();
  
  // Format exposure cluster
  const apertureStr = formatAperture(exif.FNumber);
  const shutterStr = formatShutter(exif.ExposureTime);
  const rawIso = exif.ISO || exif.ISOSpeedRatings;
  const isoStr = rawIso ? `ISO ${rawIso}` : '';
  const focalStr = exif.FocalLength ? `${Number(exif.FocalLength).toFixed(0)}mm` : '';

  const exposureParts = [focalStr, apertureStr, shutterStr, isoStr].filter(Boolean);
  const exposureStr = exposureParts.join('   ');

  const dateStr = exif.DateTimeOriginal ? formatExifDate(String(exif.DateTimeOriginal)).split(',')[0] : '';

  if (style === WATERMARK_STYLES.FLOATING_GLASS) {
    // Canvas dimensions identical to image
    canvas.width = imgW;
    canvas.height = imgH;

    ctx.drawImage(img, 0, 0, imgW, imgH);

    // Floating pill dimensions
    const pillW = Math.max(340, Math.round(imgW * 0.32));
    const pillH = Math.max(68, Math.round(imgH * 0.08));
    const pillMargin = Math.round(imgW * 0.03);
    const pillX = imgW - pillW - pillMargin;
    const pillY = imgH - pillH - pillMargin;
    const pillRadius = 14;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(15, 15, 20, 0.75)';
    roundRect(ctx, pillX, pillY, pillW, pillH, pillRadius);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, pillX, pillY, pillW, pillH, pillRadius);
    ctx.stroke();
    ctx.restore();

    // Red Dot Accent
    const dotX = pillX + 22;
    const dotY = pillY + pillH / 2;
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Camera text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(13, Math.round(pillH * 0.26))}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(cameraModel, dotX + 16, pillY + pillH * 0.36);

    // Exposure text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = `${Math.max(11, Math.round(pillH * 0.22))}px monospace`;
    ctx.fillText(exposureStr || dateStr, dotX + 16, pillY + pillH * 0.68);

    return canvas.toDataURL('image/jpeg', 0.95);
  }

  // Letterbox Styles (Leica White / Obsidian Black / Hasselblad Border)
  const isDark = style === WATERMARK_STYLES.OBSIDIAN_BLACK;
  const isHasselblad = style === WATERMARK_STYLES.HASSELBLAD_BORDER;

  const barHeight = Math.max(80, Math.round(imgW * 0.11));
  const borderWidth = isHasselblad ? Math.max(16, Math.round(imgW * 0.025)) : 0;

  canvas.width = imgW + borderWidth * 2;
  canvas.height = imgH + barHeight + borderWidth * 2;

  // Background Fill
  ctx.fillStyle = isDark ? '#0c0d11' : '#f8f8fa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw image
  ctx.drawImage(img, borderWidth, borderWidth, imgW, imgH);

  // Hairline border beneath photo
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(borderWidth, borderWidth + imgH);
  ctx.lineTo(borderWidth + imgW, borderWidth + imgH);
  ctx.stroke();

  // Watermark Bar Positioning
  const barTop = borderWidth + imgH;
  const paddingX = Math.round(imgW * 0.05);
  const leftX = borderWidth + paddingX;
  const rightX = canvas.width - borderWidth - paddingX;
  const centerY = barTop + barHeight / 2;

  // 1. Left Cluster: Camera Brand & Photographer Name
  const dotRadius = Math.max(7, Math.round(barHeight * 0.11));
  const dotX = leftX + dotRadius;
  const dotY = centerY;

  if (isHasselblad) {
    // Hasselblad orange square emblem
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(leftX, centerY - dotRadius, dotRadius * 2, dotRadius * 2);
  } else {
    // Leica classic red dot
    ctx.fillStyle = isDark ? '#f43f5e' : '#e11d48';
    ctx.beginPath();
    ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  const textLeftX = leftX + dotRadius * 2 + 14;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isDark ? '#ffffff' : '#111827';
  const modelFontSize = Math.max(16, Math.round(barHeight * 0.25));
  ctx.font = `bold ${modelFontSize}px system-ui, -apple-system, sans-serif`;
  
  if (artistName) {
    ctx.fillText(cameraModel, textLeftX, centerY - barHeight * 0.16);
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.55)';
    ctx.font = `italic ${Math.max(12, Math.round(barHeight * 0.18))}px system-ui, sans-serif`;
    ctx.fillText(`Shot by ${artistName}`, textLeftX, centerY + barHeight * 0.2);
  } else {
    ctx.fillText(cameraModel, textLeftX, centerY);
  }

  // 2. Right Cluster: Exposure Specs & Date
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isDark ? '#ffffff' : '#111827';
  const exposureFontSize = Math.max(14, Math.round(barHeight * 0.22));
  ctx.font = `bold ${exposureFontSize}px monospace`;

  if (dateStr) {
    ctx.fillText(exposureStr, rightX, centerY - barHeight * 0.16);
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
    ctx.font = `${Math.max(11, Math.round(barHeight * 0.17))}px monospace`;
    ctx.fillText(dateStr.toUpperCase(), rightX, centerY + barHeight * 0.2);
  } else {
    ctx.fillText(exposureStr, rightX, centerY);
  }

  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Downloads the watermarked photo to user's device.
 */
export async function downloadWatermarkedPhoto(photo, options = {}) {
  const dataUrl = await generateWatermarkDataURL(photo, options);
  if (!dataUrl) return;

  const baseName = (photo.name || 'image').replace(/\.[^/.]+$/, '');
  const link = document.createElement('a');
  link.download = `ExifGrid-Stamped-${baseName}.jpg`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
