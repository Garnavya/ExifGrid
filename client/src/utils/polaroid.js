/**
 * Canvas Polaroid exporter — migrated from vanilla generatePolaroidDataURL / downloadPolaroid.
 * Runs entirely client-side; output is a JPEG data URL for preview or download.
 */
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

  if (settings.exifToggles?.includes('camera') && exif.Model) exifParts.push(`📸 ${exif.Model}`);
  if (settings.exifToggles?.includes('aperture') && exif.FNumber) exifParts.push(`f/${exif.FNumber}`);
  if (settings.exifToggles?.includes('shutter') && exif.ExposureTime) {
    exifParts.push(`1/${Math.round(1 / exif.ExposureTime)}s`);
  }
  if (settings.exifToggles?.includes('iso') && exif.ISOSpeedRatings) {
    exifParts.push(`ISO ${exif.ISOSpeedRatings}`);
  }

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
    const exifSize = Math.max(20, Math.round(baseSize * 0.018));
    ctx.font = `bold ${exifSize}px monospace`;
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
