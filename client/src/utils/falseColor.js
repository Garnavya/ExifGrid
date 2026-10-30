/**
 * Cinematic False-Color Exposure & Ansel Adams Zone System Heatmap.
 * 
 * Provides exposure telemetry used in cinema production (ARRI / RED / Sony Venice)
 * and fine-art zone system photography:
 * - Cinema IRE Heatmap (Purple = 0-2 IRE, Green = 18% Gray, Pink = Skin tones, Red = Blown highlights)
 * - Ansel Adams 10-Zone System Exposure Visualizer
 * - Real-time Dynamic Range & Clipping Metrics (% Crushed Blacks vs % Blown Highlights)
 */

export const FALSE_COLOR_MODES = {
  CINEMA_IRE: 'cinema_ire',
  ZONE_SYSTEM: 'zone_system'
};

export const IRE_LEGEND = [
  { label: 'Clipped Black (0-2)', color: '#800080', ire: '0-2' },
  { label: 'Deep Shadow (3-18)', color: '#0032b4', ire: '3-18' },
  { label: 'Dark Midtone (19-35)', color: '#00b4c8', ire: '19-35' },
  { label: '18% Middle Gray (38-42)', color: '#00dc00', ire: '38-42' },
  { label: 'Skin Tone (52-58)', color: '#ff69b4', ire: '52-58' },
  { label: 'High Midtone (59-84)', color: '#64748b', ire: '59-84' },
  { label: 'Near Clip (85-98)', color: '#ffe600', ire: '85-98' },
  { label: 'Blown Specular (99-100)', color: '#ff0000', ire: '99-100' }
];

export const ZONE_LEGEND = [
  { label: 'Zone 0 (Pure Black)', color: '#0a0a0a' },
  { label: 'Zone II (Textured Shadow)', color: '#3c3c3c' },
  { label: 'Zone IV (Dark Foliage)', color: '#4b6e3c' },
  { label: 'Zone V (18% Gray Card)', color: '#00c864' },
  { label: 'Zone VI (Average Skin)', color: '#f0a078' },
  { label: 'Zone VIII (Textured White)', color: '#e6e6e6' },
  { label: 'Zone X (Blown Pure White)', color: '#ff1e1e' }
];

/**
 * Processes an image source and renders the false-color exposure heatmap canvas.
 * 
 * @param {string|HTMLImageElement} imageInput Image element or src string
 * @param {Object} options Configuration options
 * @returns {Promise<{ dataUrl: string, stats: Object }>}
 */
export async function processFalseColorDiagnostic(imageInput, options = {}) {
  let img;
  if (typeof imageInput === 'string') {
    img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageInput;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
  } else {
    img = imageInput;
  }

  const mode = options.mode || FALSE_COLOR_MODES.CINEMA_IRE;

  const MAX_DIM = 1600;
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
  if (w > MAX_DIM || h > MAX_DIM) {
    const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const totalPixels = w * h;

  let crushedCount = 0;
  let midGrayCount = 0;
  let skinToneCount = 0;
  let blownCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Compute luminance and IRE (0 to 100)
    const lum = (0.299 * r) + (0.587 * g) + (0.114 * b);
    const ire = (lum / 255.0) * 100.0;

    if (mode === FALSE_COLOR_MODES.CINEMA_IRE) {
      if (ire <= 2.0) {
        // Deep Purple: Crushed Blacks
        data[i] = 128;
        data[i + 1] = 0;
        data[i + 2] = 128;
        crushedCount++;
      } else if (ire <= 18.0) {
        // Deep Navy: Shadow Detail
        data[i] = 0;
        data[i + 1] = 50;
        data[i + 2] = 180;
      } else if (ire <= 35.0) {
        // Cyan: Dark Midtones
        data[i] = 0;
        data[i + 1] = 180;
        data[i + 2] = 200;
      } else if (ire >= 38.0 && ire <= 42.0) {
        // Vibrant Green: 18% Middle Gray
        data[i] = 0;
        data[i + 1] = 220;
        data[i + 2] = 0;
        midGrayCount++;
      } else if (ire >= 52.0 && ire <= 58.0) {
        // Rose Pink: Optimum Caucasian Skin Tone
        data[i] = 255;
        data[i + 1] = 105;
        data[i + 2] = 180;
        skinToneCount++;
      } else if (ire >= 85.0 && ire <= 98.0) {
        // Bright Yellow: Near Clipping
        data[i] = 255;
        data[i + 1] = 230;
        data[i + 2] = 0;
      } else if (ire >= 99.0) {
        // Pure Red: Blown Specular Clipping
        data[i] = 255;
        data[i + 1] = 0;
        data[i + 2] = 0;
        blownCount++;
      } else {
        // Neutral Slate / Muted Grayscale for unmapped ranges
        const m = Math.round(lum * 0.45);
        data[i] = m;
        data[i + 1] = m;
        data[i + 2] = m;
      }
    } else {
      // ANSEL ADAMS 10-ZONE SYSTEM
      if (ire < 5) {
        // Zone 0: Pure Black
        data[i] = 10; data[i + 1] = 10; data[i + 2] = 10;
        crushedCount++;
      } else if (ire < 15) {
        // Zone I: Near Black
        data[i] = 30; data[i + 1] = 30; data[i + 2] = 30;
      } else if (ire < 25) {
        // Zone II: Textured Shadow
        data[i] = 60; data[i + 1] = 60; data[i + 2] = 60;
      } else if (ire < 35) {
        // Zone III: Dark Surface
        data[i] = 90; data[i + 1] = 90; data[i + 2] = 90;
      } else if (ire < 45) {
        // Zone IV: Dark Foliage / Shadow Skin
        data[i] = 75; data[i + 1] = 110; data[i + 2] = 60;
      } else if (ire < 55) {
        // Zone V: 18% Middle Gray
        data[i] = 0; data[i + 1] = 200; data[i + 2] = 100;
        midGrayCount++;
      } else if (ire < 65) {
        // Zone VI: Average Caucasian Skin
        data[i] = 240; data[i + 1] = 160; data[i + 2] = 120;
        skinToneCount++;
      } else if (ire < 75) {
        // Zone VII: Pale Skin / Textured Light Tone
        data[i] = 200; data[i + 1] = 200; data[i + 2] = 200;
      } else if (ire < 85) {
        // Zone VIII: Textured White
        data[i] = 230; data[i + 1] = 230; data[i + 2] = 230;
      } else if (ire < 95) {
        // Zone IX: Pure White
        data[i] = 245; data[i + 1] = 245; data[i + 2] = 245;
      } else {
        // Zone X: Blown Clipping
        data[i] = 255; data[i + 1] = 30; data[i + 2] = 30;
        blownCount++;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const stats = {
    crushedPercent: ((crushedCount / totalPixels) * 100).toFixed(1),
    midGrayPercent: ((midGrayCount / totalPixels) * 100).toFixed(1),
    skinTonePercent: ((skinToneCount / totalPixels) * 100).toFixed(1),
    blownPercent: ((blownCount / totalPixels) * 100).toFixed(1),
    mode
  };

  // Draw Diagnostic Legend on Canvas
  drawDiagnosticLegend(ctx, w, h, mode, stats);

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.92),
    stats
  };
}

/**
 * Draws the exposure color scale bar and clipping telemetry banner.
 */
function drawDiagnosticLegend(ctx, w, h, mode, stats) {
  ctx.save();

  const barH = 32;
  const barY = h - barH;

  // Background strip
  ctx.fillStyle = 'rgba(10, 10, 12, 0.88)';
  ctx.fillRect(0, barY, w, barH);

  // Top border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, barY);
  ctx.lineTo(w, barY);
  ctx.stroke();

  // Metrics text
  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'left';

  const title = mode === FALSE_COLOR_MODES.CINEMA_IRE ? 'EXPOSURE [ CINEMA IRE ]' : 'EXPOSURE [ ANSEL ADAMS ZONE SYSTEM ]';
  ctx.fillText(`${title} • CRUSHED: ${stats.crushedPercent}% | 18% GRAY: ${stats.midGrayPercent}% | SKIN: ${stats.skinTonePercent}% | CLIPPED: ${stats.blownPercent}%`, 16, barY + 20);

  ctx.restore();
}
