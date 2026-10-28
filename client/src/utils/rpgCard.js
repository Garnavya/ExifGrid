import { formatAperture, formatShutter, formatExifDate } from './formatters.js';

/**
 * Calculates RPG-style gaming statistics and traits from EXIF metadata.
 * 
 * @param {Object} photo Photo object containing .exif and file metadata
 * @returns {Object} Calculated stats, archetype, rarity, and lore
 */
export function calculateRpgStats(photo) {
  const exif = photo?.exif || {};

  // 1. Shutter Speed -> Agility (AGI)
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

  // 2. Aperture -> Power / Lumens (PWR)
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

  // 3. ISO -> Sensor Purity / Stealth (PUR)
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

  // 4. Focal Length -> Optical Reach (RCH)
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
  let perkDesc = 'Strikes when light, movement, and human expression converge in spontaneous harmony.';

  if (rawAperture <= 1.8) {
    archetype = 'Bokeh Sorcerer';
    perkName = 'Planar Isolation';
    perkDesc = 'Obliterates background distractions into ethereal dream circles, isolating the subject in hyper-reality.';
  } else if (rawShutter <= 0.0005) {
    archetype = 'Speed Berserker';
    perkName = 'Chronos Freeze';
    perkDesc = 'Stops physical kinetic energy in mid-air, rendering high-velocity moments with zero motion blur.';
  } else if (rawFocal >= 200) {
    archetype = 'Photon Sniper';
    perkName = 'Far-Sight Piercing';
    perkDesc = 'Captures distant adversaries and micro-expressions across hundreds of meters with lethal focal precision.';
  } else if (rawIso >= 3200) {
    archetype = 'Shadow Stalker';
    perkName = 'Darkvision Array';
    perkDesc = 'Extracts hidden photons from dark abysses where human eyes and lesser optical sensors go blind.';
  } else if (rawShutter >= 1.5) {
    archetype = 'Chronomancer';
    perkName = 'Temporal Flow';
    perkDesc = 'Melts passing light and ocean waves into smooth celestial brushstrokes across continuous spacetime.';
  } else if (rawFocal <= 20) {
    archetype = 'Horizon Warden';
    perkName = 'Grand Panorama';
    perkDesc = 'Bends expansive landscapes and monolithic architecture into an encompassing field of vision.';
  } else if (rawAperture >= 8.0 && rawShutter <= 0.016) {
    archetype = 'Hyperfocal Sage';
    perkName = 'Infinite Depth';
    perkDesc = 'Locks crystalline sharpness across every millimeter from foreground rocks to the furthest stars.';
  }

  // Level & Power Calculation
  const totalPower = Math.round((agi * 1.1 + pwr * 1.1 + pur * 0.9 + rch * 0.9) / 4);
  const gearLevel = Math.min(99, Math.max(15, totalPower));

  // Rarity Determination
  let rarity = 'COMMON';
  if (totalPower >= 85) rarity = 'MYTHIC';
  else if (totalPower >= 75) rarity = 'LEGENDARY';
  else if (totalPower >= 64) rarity = 'EPIC';
  else if (totalPower >= 50) rarity = 'RARE';

  return {
    stats: { agi, pwr, pur, rch },
    rawValues: {
      shutter: formatShutter(exif.ExposureTime) || `${rawShutter}s`,
      aperture: formatAperture(exif.FNumber) || `f/${rawAperture}`,
      iso: `ISO ${rawIso}`,
      focal: `${Math.round(rawFocal)}mm`
    },
    archetype,
    perkName,
    perkDesc,
    gearLevel,
    rarity
  };
}

/**
 * Rarity Visual Theme Palettes
 */
export const RARITY_THEMES = {
  MYTHIC: {
    name: 'Mythic Prismatic',
    badge: '★ MYTHIC ★',
    primary: '#f43f5e',
    secondary: '#d946ef',
    accent: '#06b6d4',
    bgStart: '#11071f',
    bgEnd: '#05020a',
    borderGradient: ['#f43f5e', '#ec4899', '#a855f7', '#06b6d4', '#f43f5e'],
    barColor: '#d946ef',
    glow: 'rgba(217, 70, 239, 0.45)'
  },
  LEGENDARY: {
    name: 'Molten Gold',
    badge: '★ LEGENDARY ★',
    primary: '#fbbf24',
    secondary: '#f59e0b',
    accent: '#fef08a',
    bgStart: '#181206',
    bgEnd: '#0a0702',
    borderGradient: ['#fbbf24', '#f59e0b', '#d97706', '#fef08a', '#fbbf24'],
    barColor: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.45)'
  },
  EPIC: {
    name: 'Cyber Amethyst',
    badge: '✦ EPIC ✦',
    primary: '#a855f7',
    secondary: '#6366f1',
    accent: '#e9d5ff',
    bgStart: '#0f0e26',
    bgEnd: '#050410',
    borderGradient: ['#a855f7', '#818cf8', '#6366f1', '#c084fc', '#a855f7'],
    barColor: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.4)'
  },
  RARE: {
    name: 'Cobalt Emerald',
    badge: '◆ RARE ◆',
    primary: '#0ea5e9',
    secondary: '#10b981',
    accent: '#7dd3fc',
    bgStart: '#061726',
    bgEnd: '#020910',
    borderGradient: ['#0ea5e9', '#38bdf8', '#10b981', '#34d399', '#0ea5e9'],
    barColor: '#0ea5e9',
    glow: 'rgba(14, 165, 233, 0.35)'
  },
  COMMON: {
    name: 'Steel Titanium',
    badge: '● COMMON ●',
    primary: '#94a3b8',
    secondary: '#64748b',
    accent: '#cbd5e1',
    bgStart: '#141824',
    bgEnd: '#090b10',
    borderGradient: ['#94a3b8', '#64748b', '#475569', '#cbd5e1', '#94a3b8'],
    barColor: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.25)'
  }
};

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
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
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
 * Generates an RPG Trading Card as a high-resolution canvas DataURL.
 * 
 * @param {Object} photo Photo object with src and exif
 * @param {Object} options Configuration overrides
 * @returns {Promise<string>} High-res image data URL (PNG/JPEG)
 */
export async function generateRpgCardDataURL(photo, options = {}) {
  if (!photo?.src) return null;

  // Calculate base stats
  const calculated = calculateRpgStats(photo);
  const rarity = options.rarity || calculated.rarity;
  const theme = RARITY_THEMES[rarity] || RARITY_THEMES.COMMON;
  const archetype = options.archetype || calculated.archetype;
  const customTitle = options.title || photo.name.replace(/\.[^/.]+$/, '');
  const gearLevel = calculated.gearLevel;
  const stats = calculated.stats;
  const rawValues = calculated.rawValues;
  const perkName = options.perkName || calculated.perkName;
  const perkDesc = options.perkDesc || calculated.perkDesc;

  // High-resolution collectible card dimensions
  const CARD_W = 800;
  const CARD_H = 1140;

  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');

  // Load photo
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = photo.src;
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
  });

  // 1. Base Background & Outer Frame
  const cardRadius = 28;
  roundRect(ctx, 0, 0, CARD_W, CARD_H, cardRadius);
  ctx.clip();

  // Dark background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bgGrad.addColorStop(0, theme.bgStart);
  bgGrad.addColorStop(1, theme.bgEnd);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Subtle carbon/cyber lattice pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  const gridSize = 32;
  for (let x = 0; x < CARD_W; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CARD_H);
    ctx.stroke();
  }
  for (let y = 0; y < CARD_H; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CARD_W, y);
    ctx.stroke();
  }

  // 2. Ornate Border Frame
  const borderWidth = 10;
  const borderGrad = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  theme.borderGradient.forEach((color, i) => {
    borderGrad.addColorStop(i / (theme.borderGradient.length - 1), color);
  });

  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = borderWidth;
  roundRect(ctx, borderWidth / 2, borderWidth / 2, CARD_W - borderWidth, CARD_H - borderWidth, cardRadius - 4);
  ctx.stroke();

  // Inner hairline accent
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 16, 16, CARD_W - 32, CARD_H - 32, cardRadius - 10);
  ctx.stroke();

  // Corner Bevel Accents
  const cornerSize = 24;
  const corners = [
    [24, 24],
    [CARD_W - 24, 24],
    [24, CARD_H - 24],
    [CARD_W - 24, CARD_H - 24]
  ];
  ctx.fillStyle = theme.primary;
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // 3. Card Header
  const headerX = 42;
  const headerY = 46;

  // Card Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const displayTitle = customTitle.length > 24 ? customTitle.substring(0, 24) + '…' : customTitle;
  ctx.fillText(displayTitle.toUpperCase(), headerX, headerY);

  // Subtitle (Camera Make/Model + Gear Level)
  const cameraText = photo.exif?.Model || photo.exif?.Make || 'CUSTOM OPTICS';
  ctx.font = '11px monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText(`LVL ${gearLevel} • ${cameraText.toUpperCase()}`, headerX, headerY + 22);

  // Rarity Pill Badge (Top Right)
  const badgeText = theme.badge;
  ctx.font = 'bold 12px monospace';
  const badgeWidth = ctx.measureText(badgeText).width + 24;
  const badgeHeight = 26;
  const badgeX = CARD_W - 42 - badgeWidth;
  const badgeY = headerY - 10;

  // Badge glow & background
  ctx.save();
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 12;
  ctx.fillStyle = theme.primary;
  roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 13);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);

  // 4. Center Artwork Window
  const artX = 42;
  const artY = 96;
  const artW = CARD_W - 84;
  const artH = 430;
  const artRadius = 14;

  ctx.save();
  roundRect(ctx, artX, artY, artW, artH, artRadius);
  ctx.clip();

  // Aspect-fill image crop
  const scale = Math.max(artW / img.width, artH / img.height);
  const cropW = img.width * scale;
  const cropH = img.height * scale;
  const cropX = artX + (artW - cropW) / 2;
  const cropY = artY + (artH - cropH) / 2;
  ctx.drawImage(img, cropX, cropY, cropW, cropH);

  // Inner border & vignette shadow
  const artVignette = ctx.createLinearGradient(0, artY, 0, artY + artH);
  artVignette.addColorStop(0, 'rgba(0,0,0,0.2)');
  artVignette.addColorStop(0.8, 'rgba(0,0,0,0.0)');
  artVignette.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = artVignette;
  ctx.fillRect(artX, artY, artW, artH);
  ctx.restore();

  // Art border
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 2.5;
  roundRect(ctx, artX, artY, artW, artH, artRadius);
  ctx.stroke();

  // Class Archetype Banner (Floating atop lower photo edge)
  const classText = `⚡ ${archetype.toUpperCase()}`;
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  const classWidth = ctx.measureText(classText).width + 36;
  const classHeight = 32;
  const classX = CARD_W / 2 - classWidth / 2;
  const classY = artY + artH - 16;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#0a0a14';
  roundRect(ctx, classX, classY, classWidth, classHeight, 8);
  ctx.fill();
  ctx.strokeStyle = theme.primary;
  ctx.lineWidth = 1.5;
  roundRect(ctx, classX, classY, classWidth, classHeight, 8);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = theme.accent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(classText, CARD_W / 2, classY + classHeight / 2);

  // 5. RPG Attributes & Power Meters
  const statsStartY = 560;
  const statRows = [
    { label: 'AGI', name: 'AGILITY', score: stats.agi, raw: rawValues.shutter, desc: 'Freeze Kinetic Motion' },
    { label: 'PWR', name: 'LUMENS', score: stats.pwr, raw: rawValues.aperture, desc: 'Optical Inflow & Depth' },
    { label: 'PUR', name: 'PURITY', score: stats.pur, raw: rawValues.iso, desc: 'Grain-Free Quantum Fidelity' },
    { label: 'RCH', name: 'REACH', score: stats.rch, raw: rawValues.focal, desc: 'Telephoto Distance Range' }
  ];

  const barX = 140;
  const barW = CARD_W - 84 - 230;
  const barH = 14;

  statRows.forEach((item, index) => {
    const curY = statsStartY + index * 42;

    // Attribute Label & Name
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = theme.primary;
    ctx.fillText(item.label, 44, curY + 7);

    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText(item.name, 80, curY + 7);

    // Track
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    roundRect(ctx, barX, curY, barW, barH, 4);
    ctx.fill();

    // Fill
    const fillW = Math.max(8, Math.round((item.score / 100) * barW));
    const statGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
    statGrad.addColorStop(0, theme.secondary);
    statGrad.addColorStop(1, theme.primary);

    ctx.save();
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 6;
    ctx.fillStyle = statGrad;
    roundRect(ctx, barX, curY, fillW, barH, 4);
    ctx.fill();
    ctx.restore();

    // Score & Raw EXIF text
    ctx.textAlign = 'right';
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${item.score}`, CARD_W - 130, curY + 7);

    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(item.raw, CARD_W - 44, curY + 7);
  });

  // 6. Ability & Perk Lore Box
  const perkBoxX = 42;
  const perkBoxY = 744;
  const perkBoxW = CARD_W - 84;
  const perkBoxH = 144;
  const perkBoxRadius = 10;

  // Background box
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  roundRect(ctx, perkBoxX, perkBoxY, perkBoxW, perkBoxH, perkBoxRadius);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  roundRect(ctx, perkBoxX, perkBoxY, perkBoxW, perkBoxH, perkBoxRadius);
  ctx.stroke();

  // Left glowing accent bar
  ctx.fillStyle = theme.primary;
  ctx.fillRect(perkBoxX, perkBoxY + 14, 4, perkBoxH - 28);

  // Perk Title
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillStyle = theme.accent;
  ctx.fillText(`✦ SPECIAL TRAIT: ${perkName.toUpperCase()}`, perkBoxX + 22, perkBoxY + 20);

  // Perk Description (Word wrapped)
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  wrapText(ctx, perkDesc, perkBoxX + 22, perkBoxY + 48, perkBoxW - 44, 22);

  // Technical Synergy Badge
  const synergyText = `SYNERGY: ${rawValues.aperture} • ${rawValues.shutter} • ${rawValues.iso} • ${rawValues.focal}`;
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillText(synergyText, perkBoxX + 22, perkBoxY + 114);

  // 7. Collector Footer
  const footerY = CARD_H - 48;
  const serialSeed = (photo.name + (photo.size || 0)).split('').reduce((acc, c) => acc + c.charCodeAt(0), 1000);
  const serialNo = `CARD NO. #EG-${serialSeed % 9999}-${gearLevel}`;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillText(serialNo, 44, footerY);

  ctx.textAlign = 'center';
  ctx.fillText('EXIFGRID COLLECTIBLE SERIES', CARD_W / 2, footerY);

  const dateText = photo.exif?.DateTimeOriginal ? formatExifDate(photo.exif.DateTimeOriginal.toString()).split(',')[0] : 'FIRST EDITION';
  ctx.textAlign = 'right';
  ctx.fillText(dateText.toUpperCase(), CARD_W - 44, footerY);

  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Downloads the generated RPG card to the user's device.
 */
export async function downloadRpgCard(photo, options = {}) {
  const dataUrl = await generateRpgCardDataURL(photo, options);
  if (!dataUrl) return;

  const baseName = (photo.name || 'card').replace(/\.[^/.]+$/, '');
  const link = document.createElement('a');
  link.download = `ExifGrid-RPG-Card-${baseName}.jpg`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
