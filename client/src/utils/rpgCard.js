import { formatAperture, formatShutter, formatExifDate } from './formatters.js';

/**
 * Calculates photographic statistics, archetype traits, and exposure metadata.
 * 
 * @param {Object} photo Photo object containing .exif and file metadata
 * @returns {Object} Calculated stats, archetype, rarity, and lore
 */
export function calculateRpgStats(photo) {
  const exif = photo?.exif || {};

  // 1. Shutter Speed -> Kinetic Agility / Slice (AGI)
  let rawShutter = 0.008; // default ~1/125s
  if (exif.ExposureTime) {
    if (typeof exif.ExposureTime === 'object' && exif.ExposureTime.denominator) {
      rawShutter = exif.ExposureTime.numerator / exif.ExposureTime.denominator;
    } else {
      rawShutter = Number(exif.ExposureTime) || 0.008;
    }
  }

  let agi = 55;
  if (rawShutter <= 0.000125) agi = 99;      // <= 1/8000s
  else if (rawShutter <= 0.00025) agi = 95;  // <= 1/4000s
  else if (rawShutter <= 0.0005) agi = 90;   // <= 1/2000s
  else if (rawShutter <= 0.001) agi = 85;    // <= 1/1000s
  else if (rawShutter <= 0.002) agi = 78;    // <= 1/500s
  else if (rawShutter <= 0.004) agi = 70;    // <= 1/250s
  else if (rawShutter <= 0.008) agi = 60;    // <= 1/125s
  else if (rawShutter <= 0.016) agi = 48;    // <= 1/60s
  else if (rawShutter <= 0.033) agi = 36;    // <= 1/30s
  else if (rawShutter <= 0.25) agi = 25;     // <= 1/4s
  else agi = 18;                             // Long exposure

  // 2. Aperture -> Optical Inflow / Luminance (PWR)
  let rawAperture = 4.0;
  if (exif.FNumber) {
    if (typeof exif.FNumber === 'object' && exif.FNumber.denominator) {
      rawAperture = exif.FNumber.numerator / exif.FNumber.denominator;
    } else {
      rawAperture = Number(exif.FNumber) || 4.0;
    }
  }

  let pwr = 50;
  if (rawAperture <= 1.2) pwr = 100;
  else if (rawAperture <= 1.4) pwr = 96;
  else if (rawAperture <= 1.8) pwr = 91;
  else if (rawAperture <= 2.0) pwr = 86;
  else if (rawAperture <= 2.8) pwr = 78;
  else if (rawAperture <= 4.0) pwr = 66;
  else if (rawAperture <= 5.6) pwr = 54;
  else if (rawAperture <= 8.0) pwr = 44;
  else if (rawAperture <= 11) pwr = 34;
  else pwr = 24;

  // 3. ISO -> Quantum Emulsion Purity / SNR (PUR)
  const rawIso = Number(exif.ISO || exif.ISOSpeedRatings) || 200;
  let pur = 80;
  if (rawIso <= 100) pur = 99;
  else if (rawIso <= 200) pur = 93;
  else if (rawIso <= 400) pur = 86;
  else if (rawIso <= 800) pur = 74;
  else if (rawIso <= 1600) pur = 60;
  else if (rawIso <= 3200) pur = 48;
  else if (rawIso <= 6400) pur = 36;
  else pur = 25;

  // 4. Focal Length -> Perspective & Reach (RCH)
  let rawFocal = 50;
  if (exif.FocalLength) {
    if (typeof exif.FocalLength === 'object' && exif.FocalLength.denominator) {
      rawFocal = exif.FocalLength.numerator / exif.FocalLength.denominator;
    } else {
      rawFocal = Number(exif.FocalLength) || 50;
    }
  }

  let rch = 50;
  if (rawFocal >= 400) rch = 99;
  else if (rawFocal >= 200) rch = 92;
  else if (rawFocal >= 135) rch = 83;
  else if (rawFocal >= 85) rch = 74;
  else if (rawFocal >= 50) rch = 64;
  else if (rawFocal >= 35) rch = 52;
  else if (rawFocal >= 24) rch = 44;
  else rch = 32;

  // Archetype Class Determination
  let archetype = 'Street Vanguard';
  let perkName = 'Decisive Instant';
  let perkDesc = 'Captures the fugitive second when geometry, emotion, and ambient illumination meet in flawless equilibrium.';

  if (rawAperture <= 1.8) {
    archetype = 'Planar Isolationist';
    perkName = 'Subject Dissolution';
    perkDesc = 'Renders background clutter into buttery circular bokeh discs, isolating the subject in hyper-real dimensional pop.';
  } else if (rawShutter <= 0.0005) {
    archetype = 'Chronos Freeze';
    perkName = 'Kinetic Arrest';
    perkDesc = 'Suspends high-velocity droplets, feathers, and athlete gestures in razor-sharp microsecond stasis.';
  } else if (rawShutter >= 1.0) {
    archetype = 'Luminance Weaver';
    perkName = 'Temporal Ribbon';
    perkDesc = 'Transforms moving light trails and tidal surges into silk-smooth kinetic tapestries over extended exposures.';
  } else if (rawFocal >= 200) {
    archetype = 'Telephoto Stalker';
    perkName = 'Atmospheric Compression';
    perkDesc = 'Compresses distant spatial planes, bringing expansive backgrounds flush against the foreground subject.';
  } else if (rawFocal <= 24) {
    archetype = 'Horizon Expander';
    perkName = 'Expansive Zenith';
    perkDesc = 'Sweeps ultra-wide atmospheric grandeur into dynamic perspective vanishing points.';
  } else if (rawAperture >= 8.0 && rawAperture <= 16.0) {
    archetype = 'Hyperfocal Master';
    perkName = 'Universal Depth';
    perkDesc = 'Harmonizes infinite optical clarity from the immediate foreground blade of grass to the distant mountain peak.';
  } else if (rawIso >= 3200) {
    archetype = 'Low-Light Nocturne';
    perkName = 'Shadow Recovery';
    perkDesc = 'Draws luminance and detail out of pitch-black night scenes through advanced sensor gain amplification.';
  }

  // Composite Gear Score & Tier
  const compositeScore = Math.round(agi * 0.25 + pwr * 0.30 + pur * 0.25 + rch * 0.20);
  const gearLevel = Math.min(100, Math.max(1, Math.round(compositeScore * 1.1)));

  let rarity = 'COMMON';
  if (compositeScore >= 88) rarity = 'MYTHIC';
  else if (compositeScore >= 78) rarity = 'LEGENDARY';
  else if (compositeScore >= 68) rarity = 'EPIC';
  else if (compositeScore >= 56) rarity = 'RARE';

  return {
    gearLevel,
    rarity,
    archetype,
    perkName,
    perkDesc,
    stats: { agi, pwr, pur, rch, total: compositeScore },
    rawValues: {
      shutter: formatShutter(rawShutter),
      aperture: formatAperture(rawAperture),
      iso: `ISO ${rawIso}`,
      focal: `${Math.round(rawFocal)}mm`
    }
  };
}

/**
 * 4 Classical Photography & Darkroom Design Concepts
 */
export const RPG_CONCEPTS = {
  darkroom: {
    id: 'darkroom',
    name: 'Archival Darkroom',
    icon: '🏛️',
    tagline: 'Fine-art museum rag mat board with blind-embossed bevels',
    tiers: {
      MYTHIC: { name: 'Master Platinum Archive', badge: '★ MASTER PLATINUM ★', primary: '#d4af37', secondary: '#b5a684', mat: '#151514', bevel: '#282725', paper: '#f6f3eb', accent: '#fef3c7' },
      LEGENDARY: { name: 'Silver Gelatin Baryta', badge: '★ SILVER GELATIN ★', primary: '#f59e0b', secondary: '#d97706', mat: '#141413', bevel: '#242422', paper: '#f8f6f0', accent: '#fef08a' },
      EPIC: { name: 'Selenium Exhibition Proof', badge: '✦ SELENIUM PROOF ✦', primary: '#60a5fa', secondary: '#3b82f6', mat: '#121418', bevel: '#20242c', paper: '#f5f7fa', accent: '#dbeafe' },
      RARE: { name: 'Chlorobromide Select', badge: '◆ CHLOROBROMIDE ◆', primary: '#34d399', secondary: '#10b981', mat: '#111614', bevel: '#1e2622', paper: '#f4f8f5', accent: '#a7f3d0' },
      COMMON: { name: 'Studio Contact Print', badge: '● CONTACT PRINT ●', primary: '#b5a684', secondary: '#8a7d65', mat: '#181716', bevel: '#2a2825', paper: '#f4f3ef', accent: '#edece8' }
    }
  },
  film_slide: {
    id: 'film_slide',
    name: '35mm Film Slide',
    icon: '🎞️',
    tagline: 'Mounted cardboard transparency with film sprockets & grease crop marks',
    tiers: {
      MYTHIC: { name: 'National Geographic Select', badge: '★ NAT-GEO SELECT ★', primary: '#eab308', secondary: '#dc2626', mount: '#ece6d8', filmStock: 'KODACHROME 64', stampColor: '#b91c1c' },
      LEGENDARY: { name: 'Magnum Press First-Run', badge: '★ PRESS FIRST-RUN ★', primary: '#ef4444', secondary: '#991b1b', mount: '#e7e0d0', filmStock: 'TRI-X PAN 400', stampColor: '#991b1b' },
      EPIC: { name: 'Editorial Hero Frame', badge: '✦ EDITORIAL HERO ✦', primary: '#0ea5e9', secondary: '#0284c7', mount: '#e4ddd0', filmStock: 'FUJICHROME VELVIA', stampColor: '#0369a1' },
      RARE: { name: 'A-Roll Contact Pick', badge: '◆ A-ROLL PICK ◆', primary: '#10b981', secondary: '#047857', mount: '#e8e2d4', filmStock: 'ILFORD HP5 PLUS', stampColor: '#047857' },
      COMMON: { name: 'Contact Sheet Frame', badge: '● CONTACT FRAME ●', primary: '#78716c', secondary: '#44403c', mount: '#e5ded0', filmStock: 'KODAK GOLD 200', stampColor: '#44403c' }
    }
  },
  optical_benchmark: {
    id: 'optical_benchmark',
    name: 'Optical Benchmark',
    icon: '🔬',
    tagline: 'Precision German rangefinder chassis with vernier scales & MTF calibration',
    tiers: {
      MYTHIC: { name: 'Apochromatic Reference', badge: '★ APOCHROMATIC ★', primary: '#d4af37', secondary: '#b5a684', chassis: '#0d0e10', border: '#d4af37', accent: '#fef3c7' },
      LEGENDARY: { name: 'Grand Prix Calibration', badge: '★ GRAND PRIX ★', primary: '#f59e0b', secondary: '#d97706', chassis: '#11100e', border: '#f59e0b', accent: '#fef08a' },
      EPIC: { name: 'Optic Prime Master', badge: '✦ OPTIC PRIME ✦', primary: '#60a5fa', secondary: '#2563eb', chassis: '#0d1015', border: '#60a5fa', accent: '#dbeafe' },
      RARE: { name: 'Standard Verification', badge: '◆ VERIFIED OPTIC ◆', primary: '#34d399', secondary: '#059669', chassis: '#0c1310', border: '#34d399', accent: '#a7f3d0' },
      COMMON: { name: 'Field Specimen Benchmark', badge: '● FIELD SPECIMEN ●', primary: '#b5a684', secondary: '#78716c', chassis: '#131312', border: '#b5a684', accent: '#edece8' }
    }
  },
  heritage_guide: {
    id: 'heritage_guide',
    name: 'Heritage Field Guide',
    icon: '🧭',
    tagline: '19th-century naturalist expedition folio with aged gold corner mounts',
    tiers: {
      MYTHIC: { name: 'Expedition Masterpiece', badge: '★ EXPEDITION MASTER ★', primary: '#d4af37', secondary: '#166534', canvas: '#101d16', goldCorner: '#d4af37', accent: '#fef08a' },
      LEGENDARY: { name: 'First Edition Discovery', badge: '★ FIRST DISCOVERY ★', primary: '#f59e0b', secondary: '#854d0e', canvas: '#181712', goldCorner: '#f59e0b', accent: '#fde047' },
      EPIC: { name: 'Field Note Select', badge: '✦ FIELD NOTE ✦', primary: '#38bdf8', secondary: '#075985', canvas: '#101820', goldCorner: '#38bdf8', accent: '#bae6fd' },
      RARE: { name: 'Survey Expedition Plate', badge: '◆ SURVEY PLATE ◆', primary: '#34d399', secondary: '#065f46', canvas: '#101a15', goldCorner: '#34d399', accent: '#a7f3d0' },
      COMMON: { name: 'Observer Field Record', badge: '● OBSERVER RECORD ●', primary: '#d6c8b2', secondary: '#57534e', canvas: '#181715', goldCorner: '#b5a684', accent: '#edece8' }
    }
  }
};

export const RARITY_THEMES = RPG_CONCEPTS.optical_benchmark.tiers;

/**
 * Draws rounded rectangle path.
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

/**
 * Word wrap helper for canvas text rendering.
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

/**
 * Draws photo into the artwork window with custom user repositioning (panX, panY, cropZoom).
 */
function drawRepositionedPhoto(ctx, img, artX, artY, artW, artH, artRadius, panX, panY, cropZoom) {
  ctx.save();
  roundRect(ctx, artX, artY, artW, artH, artRadius);
  ctx.clip();

  const baseScale = Math.max(artW / img.width, artH / img.height);
  const currentScale = baseScale * cropZoom;
  const drawW = img.width * currentScale;
  const drawH = img.height * currentScale;

  const excessX = Math.max(0, drawW - artW);
  const excessY = Math.max(0, drawH - artH);

  // panX: 0 = leftmost, 50 = center, 100 = rightmost
  // panY: 0 = top (face/portrait), 50 = center, 100 = bottom
  const normX = Math.max(0, Math.min(100, panX)) / 100;
  const normY = Math.max(0, Math.min(100, panY)) / 100;

  const drawX = artX - (excessX * normX);
  const drawY = artY - (excessY * normY);

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.restore();
}

/**
 * Generates an RPG Trading Card as a canvas DataURL or Blob.
 * Supports 4 distinct photography concepts, user image repositioning, and ultra-high resolution export.
 * 
 * @param {Object} photo Photo object with src and exif
 * @param {Object} options Configuration overrides
 * @returns {Promise<string>} High-res image data URL (PNG/JPEG)
 */
export async function generateRpgCardDataURL(photo, options = {}) {
  if (!photo?.src) return null;

  const calculated = calculateRpgStats(photo);
  const rarity = options.rarity || calculated.rarity;
  const conceptKey = options.concept || 'darkroom';
  const concept = RPG_CONCEPTS[conceptKey] || RPG_CONCEPTS.darkroom;
  const theme = concept.tiers[rarity] || concept.tiers.COMMON;
  const archetype = options.archetype || calculated.archetype;
  const customTitle = options.title || photo.name.replace(/\.[^/.]+$/, '');
  const gearLevel = calculated.gearLevel;
  const stats = calculated.stats;
  const rawValues = calculated.rawValues;
  const perkName = options.perkName || calculated.perkName;
  const perkDesc = options.perkDesc || calculated.perkDesc;

  // Image repositioning options
  const panX = typeof options.panX === 'number' ? options.panX : 50;
  const panY = typeof options.panY === 'number' ? options.panY : 15; // default 15% favors faces/portraits over lower torso
  const cropZoom = typeof options.cropZoom === 'number' ? options.cropZoom : 1.0;

  // High-resolution canvas dimensions
  const CARD_W = 800;
  const CARD_H = 1140;
  // scaleMultiplier: 1.25 for quick preview, 3 for Ultra-HD print export (2400x3420, 8MB-16MB)
  const scaleMultiplier = options.scaleMultiplier || (options.isDownload ? 3 : 1.25);

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(CARD_W * scaleMultiplier);
  canvas.height = Math.round(CARD_H * scaleMultiplier);
  const ctx = canvas.getContext('2d');

  ctx.scale(scaleMultiplier, scaleMultiplier);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Load source photo
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = photo.src;
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
  });

  const cardRadius = 24;

  // -------------------------------------------------------------
  // CONCEPT 1: ARCHIVAL DARKROOM PRINT
  // -------------------------------------------------------------
  if (conceptKey === 'darkroom') {
    roundRect(ctx, 0, 0, CARD_W, CARD_H, cardRadius);
    ctx.clip();

    // Darkroom Museum Board Base
    ctx.fillStyle = theme.mat;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    // Subtle paper grain/fiber effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for (let i = 0; i < 2800; i++) {
      const rx = (Math.sin(i * 997) * 0.5 + 0.5) * CARD_W;
      const ry = (Math.cos(i * 613) * 0.5 + 0.5) * CARD_H;
      ctx.fillRect(rx, ry, 1.5, 1.5);
    }

    // Blind-embossed Outer Mat Border
    ctx.strokeStyle = theme.bevel;
    ctx.lineWidth = 3;
    roundRect(ctx, 16, 16, CARD_W - 32, CARD_H - 32, cardRadius - 8);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    roundRect(ctx, 22, 22, CARD_W - 44, CARD_H - 44, cardRadius - 12);
    ctx.stroke();

    // Header: Typography & Seal
    const headerX = 46;
    const headerY = 52;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(customTitle.toUpperCase(), headerX, headerY);

    const cameraText = photo.exif?.Model || photo.exif?.Make || 'CUSTOM CAMERA';
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(`ARCHIVAL ARCHETYPE: ${archetype.toUpperCase()} • ${cameraText.toUpperCase()}`, headerX, headerY + 22);

    // Darkroom Archival Tier Seal (Top Right)
    const badgeText = theme.badge;
    ctx.font = 'bold 11px monospace';
    const badgeWidth = ctx.measureText(badgeText).width + 24;
    const badgeHeight = 26;
    const badgeX = CARD_W - 46 - badgeWidth;
    const badgeY = headerY - 10;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 6);
    ctx.fill();
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 1.5;
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 6);
    ctx.stroke();

    ctx.fillStyle = theme.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);

    // Beveled Mat Window
    const artX = 46;
    const artY = 98;
    const artW = CARD_W - 92;
    const artH = 430;
    const artRadius = 6;

    // Mat Cut Bevel Shadow
    ctx.save();
    ctx.fillStyle = '#0a0a09';
    roundRect(ctx, artX - 4, artY - 4, artW + 8, artH + 8, artRadius + 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, artX - 4, artY - 4, artW + 8, artH + 8, artRadius + 2);
    ctx.stroke();
    ctx.restore();

    // Draw Repositioned Artwork
    drawRepositionedPhoto(ctx, img, artX, artY, artW, artH, artRadius, panX, panY, cropZoom);

    // Inner bevel shadow on photo edge
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 2;
    roundRect(ctx, artX, artY, artW, artH, artRadius);
    ctx.stroke();

    // Archetype Inset Plaque
    const plaqueY = artY + artH + 16;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    roundRect(ctx, artX, plaqueY, artW, 40, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    roundRect(ctx, artX, plaqueY, artW, 40, 6);
    ctx.stroke();

    ctx.fillStyle = theme.primary;
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`MUSEUM PROOF INDEX — ${theme.name.toUpperCase()}`, artX + 16, plaqueY + 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`FIDELITY RATING: ${gearLevel} / 100`, artX + artW - 16, plaqueY + 20);

    // Exposure Parameter Scales
    const statsStartY = plaqueY + 54;
    const darkroomMetrics = [
      { label: 'f-STOP LUMINANCE', val: rawValues.aperture, score: stats.pwr, note: 'Optical Depth Isolation' },
      { label: 'KINETIC EXPOSURE', val: rawValues.shutter, score: stats.agi, note: 'Temporal Slice Stasis' },
      { label: 'EMULSION PURITY', val: rawValues.iso, score: stats.pur, note: 'Quantum Grain Structure' },
      { label: 'PERSPECTIVE RATIO', val: rawValues.focal, score: stats.rch, note: 'Spatial Compression' }
    ];

    darkroomMetrics.forEach((item, idx) => {
      const curY = statsStartY + idx * 44;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 11px Georgia, serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, artX, curY + 6);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '10px monospace';
      ctx.fillText(item.note, artX, curY + 22);

      // Value & Score
      ctx.fillStyle = theme.primary;
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${item.val}  [ ${item.score} ]`, artX + artW, curY + 14);

      // Fine-line progress bar
      const barY = curY + 28;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(artX, barY, artW, 3);

      ctx.fillStyle = theme.primary;
      ctx.fillRect(artX, barY, Math.round(artW * (item.score / 100)), 3);
    });

    // Darkroom Master Notes (Lore Box)
    const notesY = statsStartY + 188;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    roundRect(ctx, artX, notesY, artW, 110, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    roundRect(ctx, artX, notesY, artW, 110, 8);
    ctx.stroke();

    ctx.fillStyle = theme.primary;
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(`DARKROOM CURATOR NOTES • ${perkName.toUpperCase()}`, artX + 16, notesY + 22);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '11px system-ui, sans-serif';
    wrapText(ctx, perkDesc, artX + 16, notesY + 46, artW - 32, 17);

    // Fine Art Seal Footer
    const footerY = CARD_H - 46;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SEAL OF ARCHIVAL AUTHENTICITY', 46, footerY);

    ctx.textAlign = 'center';
    ctx.fillText('EXIFGRID FINE ART DARKROOM EDITION', CARD_W / 2, footerY);

    const dateText = photo.exif?.DateTimeOriginal ? formatExifDate(photo.exif.DateTimeOriginal.toString()).split(',')[0] : 'ARCHIVAL PROOF';
    ctx.textAlign = 'right';
    ctx.fillText(dateText.toUpperCase(), CARD_W - 46, footerY);
  }

  // -------------------------------------------------------------
  // CONCEPT 2: 35mm MOUNTED FILM SLIDE
  // -------------------------------------------------------------
  else if (conceptKey === 'film_slide') {
    roundRect(ctx, 0, 0, CARD_W, CARD_H, 18);
    ctx.clip();

    // Cardboard Slide Mount Ivory
    ctx.fillStyle = theme.mount;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    // Stamped Header & Film Stock
    ctx.fillStyle = '#262420';
    ctx.font = 'bold 18px "Courier New", Courier, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(theme.filmStock, 50, 48);

    // Frame Counter Stamp
    ctx.fillStyle = theme.stampColor;
    ctx.font = 'bold 15px "Courier New", Courier, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('▶ 24A  [ 35mm TRANSPARENCY ]', CARD_W - 50, 48);

    // Top Sprocket Strip Area
    const artX = 50;
    const artY = 96;
    const artW = CARD_W - 100;
    const artH = 440;

    // Slide Aperture Border
    ctx.fillStyle = '#11100e';
    roundRect(ctx, artX - 8, artY - 8, artW + 16, artH + 16, 8);
    ctx.fill();

    // Draw Repositioned Artwork
    drawRepositionedPhoto(ctx, img, artX, artY, artW, artH, 4, panX, panY, cropZoom);

    // Red grease-pencil (Chinagraph) crop corner brackets
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    const bracketLen = 22;
    // Top Left
    ctx.beginPath();
    ctx.moveTo(artX + 10, artY + 10 + bracketLen);
    ctx.lineTo(artX + 10, artY + 10);
    ctx.lineTo(artX + 10 + bracketLen, artY + 10);
    ctx.stroke();
    // Top Right
    ctx.beginPath();
    ctx.moveTo(artW + artX - 10 - bracketLen, artY + 10);
    ctx.lineTo(artW + artX - 10, artY + 10);
    ctx.lineTo(artW + artX - 10, artY + 10 + bracketLen);
    ctx.stroke();
    // Bottom Left
    ctx.beginPath();
    ctx.moveTo(artX + 10, artY + artH - 10 - bracketLen);
    ctx.lineTo(artX + 10, artY + artH - 10);
    ctx.lineTo(artX + 10 + bracketLen, artY + artH - 10);
    ctx.stroke();
    // Bottom Right
    ctx.beginPath();
    ctx.moveTo(artW + artX - 10 - bracketLen, artY + artH - 10);
    ctx.lineTo(artW + artX - 10, artY + artH - 10);
    ctx.lineTo(artW + artX - 10, artY + artH - 10 - bracketLen);
    ctx.stroke();

    // Stamped Red Lab Archive Seal (Lower Slide Mount)
    const sealY = artY + artH + 24;
    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(customTitle.toUpperCase(), artX, sealY + 10);

    // Lab Stamp Box
    const stampText = theme.badge;
    ctx.font = 'bold 12px "Courier New", monospace';
    const stampW = ctx.measureText(stampText).width + 20;
    ctx.strokeStyle = theme.stampColor;
    ctx.lineWidth = 2;
    roundRect(ctx, CARD_W - artX - stampW, sealY - 4, stampW, 28, 4);
    ctx.stroke();
    ctx.fillStyle = theme.stampColor;
    ctx.textAlign = 'center';
    ctx.fillText(stampText, CARD_W - artX - stampW / 2, sealY + 10);

    // Handwritten Field Exposure Data
    const fieldDataY = sealY + 48;
    ctx.fillStyle = '#374151';
    ctx.font = '13px "Courier New", Courier, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`EXPOSURE LOG: ${rawValues.shutter}  •  ${rawValues.aperture}  •  ${rawValues.iso}  •  ${rawValues.focal}`, artX, fieldDataY);

    // Contact Sheet Metric Grids
    const metricsY = fieldDataY + 28;
    const filmMetrics = [
      { label: 'SHUTTER VELOCITY', val: rawValues.shutter, score: stats.agi },
      { label: 'APERTURE INFLOW', val: rawValues.aperture, score: stats.pwr },
      { label: 'GRAIN FIDELITY', val: rawValues.iso, score: stats.pur },
      { label: 'FOCAL REACH', val: rawValues.focal, score: stats.rch }
    ];

    filmMetrics.forEach((m, i) => {
      const my = metricsY + i * 36;
      ctx.fillStyle = '#4b5563';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(m.label, artX, my + 8);

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${m.val} (${m.score}%)`, artX + artW, my + 8);

      // Dashed measurement baseline
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(artX, my + 18);
      ctx.lineTo(artX + artW, my + 18);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Editorial Field Notes
    const notesY = metricsY + 160;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    roundRect(ctx, artX, notesY, artW, 90, 6);
    ctx.fill();

    ctx.fillStyle = theme.stampColor;
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`PRESS NOTE • ${archetype.toUpperCase()}`, artX + 12, notesY + 20);

    ctx.fillStyle = '#374151';
    ctx.font = '11px system-ui, sans-serif';
    wrapText(ctx, perkDesc, artX + 12, notesY + 42, artW - 24, 16);

    // Footer Stamped Number
    const footerY = CARD_H - 36;
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('PROCESS C-41 / E-6 KODAK LAB ARCHIVE', 50, footerY);
    ctx.textAlign = 'right';
    ctx.fillText('PRESS PHOTOJOURNALISM SERIES 35MM', CARD_W - 50, footerY);
  }

  // -------------------------------------------------------------
  // CONCEPT 3: OPTICAL BENCHMARK & CALIBRATION CERTIFICATE
  // -------------------------------------------------------------
  else if (conceptKey === 'optical_benchmark') {
    roundRect(ctx, 0, 0, CARD_W, CARD_H, cardRadius);
    ctx.clip();

    // Precision Matte Obsidian Base
    ctx.fillStyle = theme.chassis;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    // Milled Precision Vernier Rulers Along Left & Right Edges
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let y = 30; y < CARD_H - 30; y += 12) {
      const isMajor = (y % 60 === 0);
      const len = isMajor ? 14 : 7;
      ctx.beginPath();
      ctx.moveTo(12, y);
      ctx.lineTo(12 + len, y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(CARD_W - 12, y);
      ctx.lineTo(CARD_W - 12 - len, y);
      ctx.stroke();
    }

    // Outer Precision Border
    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 2;
    roundRect(ctx, 24, 24, CARD_W - 48, CARD_H - 48, cardRadius - 8);
    ctx.stroke();

    // Header: Rangefinder Technical Calibration Block
    const headerX = 52;
    const headerY = 56;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(customTitle.toUpperCase(), headerX, headerY);

    const cameraModel = photo.exif?.Model || photo.exif?.Make || 'OPTICAL SPECIMEN';
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(`CALIBRATION SPEC: ${cameraModel.toUpperCase()} • CLASS ${archetype.toUpperCase()}`, headerX, headerY + 22);

    // Laser-Engraved Serial Badge
    const badgeText = theme.badge;
    ctx.font = 'bold 11px monospace';
    const badgeWidth = ctx.measureText(badgeText).width + 24;
    const badgeHeight = 26;
    const badgeX = CARD_W - 52 - badgeWidth;
    const badgeY = headerY - 10;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 4);
    ctx.fill();
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 1.5;
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 4);
    ctx.stroke();

    ctx.fillStyle = theme.primary;
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);

    // Center Artwork with Precision Reticle Corners
    const artX = 52;
    const artY = 104;
    const artW = CARD_W - 104;
    const artH = 430;
    const artRadius = 4;

    drawRepositionedPhoto(ctx, img, artX, artY, artW, artH, artRadius, panX, panY, cropZoom);

    // Lens Crosshair Grid Accents
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 1.5;
    roundRect(ctx, artX, artY, artW, artH, artRadius);
    ctx.stroke();

    // Technical Metrics Section
    const metricsY = artY + artH + 28;
    const opticStats = [
      { label: 'APERTURE TRANSMISSION', val: rawValues.aperture, score: stats.pwr },
      { label: 'TEMPORAL KINETIC SLICE', val: rawValues.shutter, score: stats.agi },
      { label: 'SENSOR S/N PURITY', val: rawValues.iso, score: stats.pur },
      { label: 'OPTICAL MAGNIFICATION', val: rawValues.focal, score: stats.rch }
    ];

    opticStats.forEach((item, index) => {
      const curY = metricsY + index * 42;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, artX, curY + 6);

      // Technical Gauge Bar
      const barX = artX + 220;
      const barW = artW - 340;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      roundRect(ctx, barX, curY, barW, 10, 2);
      ctx.fill();

      ctx.fillStyle = theme.primary;
      const fillW = Math.round(barW * (item.score / 100));
      roundRect(ctx, barX, curY, fillW, 10, 2);
      ctx.fill();

      // Readouts
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${item.val}`, artX + artW - 40, curY + 6);

      ctx.fillStyle = theme.primary;
      ctx.fillText(`${item.score}%`, artX + artW, curY + 6);
    });

    // Optical Synergy & Certificate Note
    const certY = metricsY + 180;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    roundRect(ctx, artX, certY, artW, 106, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    roundRect(ctx, artX, certY, artW, 106, 6);
    ctx.stroke();

    ctx.fillStyle = theme.primary;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`MTF CERTIFICATION • ${perkName.toUpperCase()}`, artX + 16, certY + 22);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '11px system-ui, sans-serif';
    wrapText(ctx, perkDesc, artX + 16, certY + 44, artW - 32, 17);

    // Laser Etched Serial Footer
    const footerY = CARD_H - 46;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('CALIBRATION CERTIFICATE #EG-842-DE', 52, footerY);
    ctx.textAlign = 'right';
    ctx.fillText('LEICA / ZEISS OPTICAL TOLERANCE BENCHMARK', CARD_W - 52, footerY);
  }

  // -------------------------------------------------------------
  // CONCEPT 4: HERITAGE FIELD GUIDE / NATURALIST PORTFOLIO
  // -------------------------------------------------------------
  else if (conceptKey === 'heritage_guide') {
    roundRect(ctx, 0, 0, CARD_W, CARD_H, cardRadius);
    ctx.clip();

    // Deep Spruce / Explorer Leather Canvas
    ctx.fillStyle = theme.canvas;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    // Aged Gold Foil Inset Frame
    ctx.strokeStyle = theme.goldCorner;
    ctx.lineWidth = 2;
    roundRect(ctx, 24, 24, CARD_W - 48, CARD_H - 48, cardRadius - 8);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    roundRect(ctx, 30, 30, CARD_W - 60, CARD_H - 60, cardRadius - 12);
    ctx.stroke();

    // Header: Naturalist Specimen Titling
    const headerX = 52;
    const headerY = 56;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(customTitle.toUpperCase(), headerX, headerY);

    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillStyle = theme.accent;
    ctx.fillText(`Naturalist Portfolio Plate • Specimen Class: ${archetype}`, headerX, headerY + 22);

    // Expedition Seal Badge
    const badgeText = theme.badge;
    ctx.font = 'bold 11px monospace';
    const badgeWidth = ctx.measureText(badgeText).width + 24;
    const badgeHeight = 26;
    const badgeX = CARD_W - 52 - badgeWidth;
    const badgeY = headerY - 10;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 6);
    ctx.fill();
    ctx.strokeStyle = theme.goldCorner;
    ctx.lineWidth = 1.5;
    roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 6);
    ctx.stroke();

    ctx.fillStyle = theme.goldCorner;
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);

    // Center Artwork Window
    const artX = 52;
    const artY = 104;
    const artW = CARD_W - 104;
    const artH = 430;
    const artRadius = 4;

    drawRepositionedPhoto(ctx, img, artX, artY, artW, artH, artRadius, panX, panY, cropZoom);

    // Gold Foil Photo Mounting Corners (Triangles)
    const cornerSize = 24;
    ctx.fillStyle = theme.goldCorner;
    // Top Left
    ctx.beginPath();
    ctx.moveTo(artX, artY);
    ctx.lineTo(artX + cornerSize, artY);
    ctx.lineTo(artX, artY + cornerSize);
    ctx.fill();
    // Top Right
    ctx.beginPath();
    ctx.moveTo(artX + artW, artY);
    ctx.lineTo(artX + artW - cornerSize, artY);
    ctx.lineTo(artX + artW, artY + cornerSize);
    ctx.fill();
    // Bottom Left
    ctx.beginPath();
    ctx.moveTo(artX, artY + artH);
    ctx.lineTo(artX + cornerSize, artY + artH);
    ctx.lineTo(artX, artY + artH - cornerSize);
    ctx.fill();
    // Bottom Right
    ctx.beginPath();
    ctx.moveTo(artX + artW, artY + artH);
    ctx.lineTo(artX + artW - cornerSize, artY + artH);
    ctx.lineTo(artX + artW, artY + artH - cornerSize);
    ctx.fill();

    // Naturalist Specimen Observation Metrics
    const metricsY = artY + artH + 28;
    const fieldObservations = [
      { label: 'AMBIENT INFLOW (f-STOP)', val: rawValues.aperture, score: stats.pwr },
      { label: 'CHRONO MOTION ARREST', val: rawValues.shutter, score: stats.agi },
      { label: 'EMULSION SENSITIVITY', val: rawValues.iso, score: stats.pur },
      { label: 'OPTICAL REACH (MM)', val: rawValues.focal, score: stats.rch }
    ];

    fieldObservations.forEach((item, index) => {
      const curY = metricsY + index * 42;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Georgia, serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, artX, curY + 6);

      // Gold Filigree Track
      const barX = artX + 220;
      const barW = artW - 320;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      roundRect(ctx, barX, curY, barW, 8, 4);
      ctx.fill();

      ctx.fillStyle = theme.goldCorner;
      const fillW = Math.round(barW * (item.score / 100));
      roundRect(ctx, barX, curY, fillW, 8, 4);
      ctx.fill();

      ctx.fillStyle = theme.accent;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(item.val, artX + artW, curY + 6);
    });

    // Expedition Journal Lore Inset
    const journalY = metricsY + 180;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    roundRect(ctx, artX, journalY, artW, 106, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
    ctx.lineWidth = 1;
    roundRect(ctx, artX, journalY, artW, 106, 6);
    ctx.stroke();

    ctx.fillStyle = theme.goldCorner;
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(`EXPEDITION LOG • ${perkName.toUpperCase()}`, artX + 16, journalY + 22);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '11px system-ui, sans-serif';
    wrapText(ctx, perkDesc, artX + 16, journalY + 44, artW - 32, 17);

    // Naturalist Plate Footer
    const footerY = CARD_H - 46;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '10px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('ROYAL GEOGRAPHICAL & NATURALIST PORTFOLIO', 52, footerY);

    const dateText = photo.exif?.DateTimeOriginal ? formatExifDate(photo.exif.DateTimeOriginal.toString()).split(',')[0] : 'FIRST SURVEY';
    ctx.textAlign = 'right';
    ctx.fillText(`EXPEDITION DATE: ${dateText.toUpperCase()}`, CARD_W - 52, footerY);
  }

  // Export format: default lossless PNG
  const format = options.format || 'image/png';
  return canvas.toDataURL(format, 1.0);
}

/**
 * Downloads the generated collectible card at full Ultra-HD Print Master Resolution (2400x3420).
 * Generates an uncompressed Lossless PNG (or 100% JPEG) to preserve 100% of the input image's detail.
 */
export async function downloadRpgCard(photo, options = {}) {
  // Enforce 3x Ultra-HD Print Master scale (2400x3420) and lossless PNG
  const fullResOptions = {
    ...options,
    isDownload: true,
    scaleMultiplier: options.scaleMultiplier || 3,
    format: options.format || 'image/png'
  };

  const dataUrl = await generateRpgCardDataURL(photo, fullResOptions);
  if (!dataUrl) return;

  const baseName = (photo.name || 'card').replace(/\.[^/.]+$/, '');
  const ext = fullResOptions.format === 'image/jpeg' ? 'jpg' : 'png';
  const link = document.createElement('a');
  link.download = `ExifGrid-Collector-Card-${baseName}.${ext}`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
