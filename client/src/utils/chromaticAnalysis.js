/**
 * Chromatic Color Composition & Radial Harmony Engine.
 * 
 * Performs high-speed client-side color distribution analysis,
 * angular hue histogram quantization, RGB channel balance,
 * and classical color theory harmony classification.
 */

/**
 * Converts RGB values (0-255) to HSL (H: 0-360, S: 0-1, L: 0-1).
 */
export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return { h: Math.round(h), s, l };
}

/**
 * Converts RGB to HEX format.
 */
export function rgbToHex(r, g, b) {
  const toHex = (n) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Calculates shortest angular distance between two hue angles in degrees (0-180).
 */
function angularDistance(a, b) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Classifies Color Harmony from dominant hue peaks.
 */
function determineColorHarmony(topPeaks, avgSat) {
  if (avgSat < 0.15 || topPeaks.length < 2) {
    return {
      type: 'MONOCHROMATIC',
      name: 'Monochromatic / Tonal',
      description: 'Unified single-hue or tonal palette with deep mood and subtle luminance variance.'
    };
  }

  const p1 = topPeaks[0].hue;
  const p2 = topPeaks[1].hue;
  const dist12 = angularDistance(p1, p2);

  if (dist12 <= 35) {
    return {
      type: 'ANALOGOUS',
      name: 'Analogous Harmony',
      description: 'Adjacent neighboring hues creating natural serenity, visual cohesion, and flow.'
    };
  }

  if (dist12 >= 155 && dist12 <= 180) {
    return {
      type: 'COMPLEMENTARY',
      name: 'Complementary Contrast',
      description: 'High-energy chromatic tension between opposite poles (e.g. Cinema Teal & Orange).'
    };
  }

  if (topPeaks.length >= 3) {
    const p3 = topPeaks[2].hue;
    const dist13 = angularDistance(p1, p3);
    const dist23 = angularDistance(p2, p3);

    // Triadic: all 3 peaks separated by ~120 degrees
    if (dist12 >= 90 && dist12 <= 140 && dist13 >= 90 && dist13 <= 140) {
      return {
        type: 'TRIADIC',
        name: 'Triadic Harmony',
        description: 'Vibrant geometric triad distributing visual weight evenly across the color wheel.'
      };
    }

    // Split Complementary: one base color and two adjacent to its complement (~130° - 160°)
    if ((dist12 >= 130 && dist12 <= 165) || (dist13 >= 130 && dist13 <= 165)) {
      return {
        type: 'SPLIT_COMPLEMENTARY',
        name: 'Split-Complementary',
        description: 'Nuanced balance offering dynamic color contrast with less abrasive visual tension.'
      };
    }
  }

  if (dist12 >= 120 && dist12 <= 165) {
    return {
      type: 'SPLIT_COMPLEMENTARY',
      name: 'Split-Complementary',
      description: 'Nuanced balance offering dynamic color contrast with less abrasive visual tension.'
    };
  }

  return {
    type: 'POLYCHROMATIC',
    name: 'Polychromatic / Diverse',
    description: 'Multifaceted scene with wide ambient chromatic spectrum.'
  };
}

/**
 * Analyzes the chromatic composition of an image from an image source/URL.
 * 
 * @param {string} src Image source (data URL, object URL, or remote URL)
 * @returns {Promise<Object>} Comprehensive chromatic breakdown
 */
export async function analyzeImageChromaticComposition(src) {
  if (!src) return null;

  let bitmap = null;
  try {
    const res = await fetch(src);
    const blob = await res.blob();

    // Scale down to 100x100 (10,000 samples) on browser background decoder
    bitmap = await createImageBitmap(blob, {
      resizeWidth: 100,
      resizeHeight: 100,
      resizeQuality: 'low'
    });

    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);

    const imgData = ctx.getImageData(0, 0, 100, 100);
    const data = imgData.data;
    const totalPixels = 100 * 100;

    // 36 Angular bins (10° per bin)
    const bins = new Float32Array(36);
    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let chromaticPixels = 0;
    let sumSat = 0;
    let warmPixels = 0;
    let coolPixels = 0;

    // Quantized color cluster map (5x5x5 = 125 color buckets)
    const clusterMap = new Map();

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      totalR += r;
      totalG += g;
      totalB += b;

      const { h, s, l } = rgbToHsl(r, g, b);
      sumSat += s;

      // Filter extreme blacks, whites, or flat neutral grays for hue distribution
      if (l > 0.08 && l < 0.94 && s > 0.12) {
        const binIndex = Math.min(35, Math.floor(h / 10));
        bins[binIndex] += s; // Weight by saturation for chromatic richness
        chromaticPixels++;

        // Warm vs Cool evaluation
        if (h <= 70 || h >= 320) {
          warmPixels++;
        } else {
          coolPixels++;
        }
      }

      // Cluster colors for palette swatches (round to 32 increments)
      const qr = Math.round(r / 32) * 32;
      const qg = Math.round(g / 32) * 32;
      const qb = Math.round(b / 32) * 32;
      const key = `${qr},${qg},${qb}`;
      clusterMap.set(key, (clusterMap.get(key) || 0) + 1);
    }

    // Normalize bins 0..1
    let maxBin = 0;
    for (let i = 0; i < 36; i++) {
      if (bins[i] > maxBin) maxBin = bins[i];
    }
    const normalizedBins = maxBin > 0 ? Array.from(bins).map(v => v / maxBin) : new Array(36).fill(0);

    // Identify dominant hue peaks
    const peaks = [];
    for (let i = 0; i < 36; i++) {
      const val = bins[i];
      if (val > 0) {
        const prev = bins[(i - 1 + 36) % 36];
        const next = bins[(i + 1) % 36];
        if (val >= prev && val >= next) {
          peaks.push({ bin: i, hue: i * 10 + 5, weight: val });
        }
      }
    }
    peaks.sort((a, b) => b.weight - a.weight);

    // Calculate RGB Balance
    const sumAllChannels = totalR + totalG + totalB || 1;
    const rgbBalance = {
      r: Math.round((totalR / sumAllChannels) * 100),
      g: Math.round((totalG / sumAllChannels) * 100),
      b: Math.round((totalB / sumAllChannels) * 100)
    };

    // Calculate Top 5 Dominant Palette Swatches
    const sortedClusters = Array.from(clusterMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const dominantPalette = sortedClusters.map(([key, count]) => {
      const [r, g, b] = key.split(',').map(Number);
      const hex = rgbToHex(r, g, b);
      const percent = Math.round((count / totalPixels) * 100);
      const { h, s, l } = rgbToHsl(r, g, b);
      return { hex, r, g, b, h, s, l, percent: Math.max(1, percent) };
    });

    const avgSat = sumSat / totalPixels;
    const harmony = determineColorHarmony(peaks, avgSat);

    const totalWarmCool = (warmPixels + coolPixels) || 1;
    const warmPercent = Math.round((warmPixels / totalWarmCool) * 100);
    const coolPercent = 100 - warmPercent;

    return {
      bins: normalizedBins,
      rawBins: Array.from(bins),
      dominantPalette,
      rgbBalance,
      harmony,
      warmCool: {
        warm: warmPercent,
        cool: coolPercent
      },
      averageSaturation: Math.round(avgSat * 100),
      topPeaks: peaks.slice(0, 3)
    };
  } catch (err) {
    console.error('Chromatic analysis failed:', err);
    return null;
  } finally {
    if (bitmap) {
      try { bitmap.close(); } catch (_) {}
    }
  }
}

/**
 * Draws the Radial RGB Chromatic Donut on a Canvas element.
 * 
 * @param {HTMLCanvasElement} canvas Target canvas
 * @param {Object} chromaticData Result from analyzeImageChromaticComposition
 * @param {number} size Logical display size (width and height in px)
 */
export function drawChromaticDonut(canvas, chromaticData, size = 200) {
  if (!canvas || !chromaticData) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.scale(dpr, dpr);

  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  const outerR = (size / 2) - 18;
  const innerR = outerR * 0.58;
  const bins = chromaticData.bins || [];

  // 1. Draw outer base chromatic track (36 segments)
  for (let i = 0; i < 36; i++) {
    const startAngle = ((i * 10 - 90) * Math.PI) / 180;
    const endAngle = (((i + 1) * 10 - 90) * Math.PI) / 180;
    const hue = i * 10 + 5;

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, endAngle);
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
    ctx.closePath();

    ctx.fillStyle = `hsla(${hue}, 85%, 50%, 0.22)`;
    ctx.fill();
  }

  // 2. Draw active dynamic radial pulses/bars based on image distribution
  for (let i = 0; i < 36; i++) {
    const weight = bins[i] || 0;
    if (weight <= 0.02) continue;

    const startAngle = ((i * 10 - 89) * Math.PI) / 180;
    const endAngle = (((i + 1) * 10 - 91) * Math.PI) / 180;
    const hue = i * 10 + 5;

    const barOuterR = innerR + (outerR - innerR) * (0.2 + weight * 0.8);

    ctx.beginPath();
    ctx.arc(cx, cy, barOuterR, startAngle, endAngle);
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
    ctx.closePath();

    ctx.fillStyle = `hsla(${hue}, 95%, ${Math.round(45 + weight * 15)}%, ${Math.min(1.0, 0.5 + weight * 0.5)})`;
    ctx.shadowColor = `hsla(${hue}, 100%, 50%, 0.7)`;
    ctx.shadowBlur = Math.round(weight * 8);
    ctx.fill();
    ctx.shadowColor = 'transparent';
  }

  // 3. Inner Bevel Rings
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.stroke();

  // 4. Center Hub Display (Pick most saturated chromatic accent color, not dark shadow)
  const chromaticSwatch = chromaticData.dominantPalette?.find(c => c.s > 0.18) || chromaticData.dominantPalette?.[0];
  const primaryColor = chromaticSwatch?.hex || '#b5a684';

  ctx.fillStyle = '#121312';
  ctx.beginPath();
  ctx.arc(cx, cy, innerR - 2, 0, Math.PI * 2);
  ctx.fill();

  // Inner color swatch orb with glowing border
  ctx.shadowColor = primaryColor;
  ctx.shadowBlur = 10;
  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Hex label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(primaryColor, cx, cy + 24);

  ctx.restore();
}
