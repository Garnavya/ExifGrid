// ─── LIGHTBOX ─────────────────────────────────────────────────────────────────
// Handles opening, populating, closing, and keyboard dismissal of the lightbox,
// plus the cinematic mobile typewriter HUD effect.

import { photos } from './state.js';
import {
  formatAperture, formatShutter, formatBytes,
  formatEV, formatExifDate,
  getFlashDesc, getMeteringMode, convertDMStoDD,
} from './formatters.js';

// ── Public API ────────────────────────────────────────────────────────────────

export function openLightbox(id) {
  const sidebar = document.getElementById('lb-sidebar');
  if (sidebar) sidebar.classList.remove('drawer-open');

  const p = photos.find(photo => photo.id === id);
  if (!p) return; // Photo already removed

  const exif = p.exif || {};

  document.getElementById('lb-filename').textContent = p.name;
  const lbImg = document.getElementById('lb-img');
  lbImg.src = '';
  setTimeout(() => { lbImg.src = p.src; }, 10);

  const meta = document.getElementById('lb-meta');
  meta.innerHTML = '';

  // File info
  meta.appendChild(_metaSection('File', [
    { k: 'Name',       v: p.name },
    { k: 'Size',       v: formatBytes(p.size) },
    { k: 'Dimensions', v: p.naturalW + ' × ' + p.naturalH + ' px' },
  ]));

  // Camera
  const cameraFields = [];
  if (exif.Make)      cameraFields.push({ k: 'Make',  v: exif.Make });
  if (exif.Model)     cameraFields.push({ k: 'Model', v: exif.Model });
  if (exif.LensModel) cameraFields.push({ k: 'Lens',  v: exif.LensModel });
  if (cameraFields.length) meta.appendChild(_metaSection('Camera', cameraFields));

  // Exposure
  const expFields = [];
  if (exif.FNumber)              expFields.push({ k: 'Aperture',    v: formatAperture(exif.FNumber),           accent: true });
  if (exif.ExposureTime)         expFields.push({ k: 'Shutter',     v: formatShutter(exif.ExposureTime),        accent: true });
  if (exif.ISOSpeedRatings)      expFields.push({ k: 'ISO',         v: 'ISO ' + exif.ISOSpeedRatings,           accent: true });
  if (exif.FocalLength)          expFields.push({ k: 'Focal',       v: exif.FocalLength.toFixed(0) + 'mm',      accent: true });
  if (exif.FocalLengthIn35mmFilm)expFields.push({ k: '35mm eq.',    v: exif.FocalLengthIn35mmFilm + 'mm' });
  if (exif.ExposureBiasValue !== undefined) expFields.push({ k: 'Exp. bias',    v: formatEV(exif.ExposureBiasValue) });
  if (exif.Flash !== undefined)  expFields.push({ k: 'Flash',       v: getFlashDesc(exif.Flash) });
  if (exif.WhiteBalance !== undefined) expFields.push({ k: 'White balance', v: exif.WhiteBalance === 0 ? 'Auto' : 'Manual' });
  if (exif.MeteringMode !== undefined) expFields.push({ k: 'Metering',     v: getMeteringMode(exif.MeteringMode) });
  if (expFields.length) meta.appendChild(_metaSection('Exposure', expFields));

  // Date & Time
  const dtFields = [];
  if (exif.DateTimeOriginal)  dtFields.push({ k: 'Taken',     v: formatExifDate(exif.DateTimeOriginal) });
  if (exif.DateTimeDigitized) dtFields.push({ k: 'Digitized', v: formatExifDate(exif.DateTimeDigitized) });
  if (dtFields.length) meta.appendChild(_metaSection('Date & Time', dtFields));

  // GPS
  if (exif.GPSLatitude && exif.GPSLongitude) {
    const lat = convertDMStoDD(exif.GPSLatitude, exif.GPSLatitudeRef);
    const lon = convertDMStoDD(exif.GPSLongitude, exif.GPSLongitudeRef);
    const gpsSection = document.createElement('div');
    gpsSection.innerHTML = `
      <div class="meta-section-title">GPS Location</div>
      <div class="meta-row"><span class="meta-key">Latitude</span><span class="meta-value">${lat.toFixed(6)}°</span></div>
      <div class="meta-row"><span class="meta-key">Longitude</span><span class="meta-value">${lon.toFixed(6)}°</span></div>
      <a class="gps-link" href="https://maps.google.com/?q=${lat},${lon}" target="_blank">
        ⌖ View on Maps
      </a>
    `;
    meta.appendChild(gpsSection);
  }

  // No EXIF fallback
  if (Object.keys(exif).length === 0) {
    const noExif = document.createElement('div');
    noExif.style.cssText = 'text-align:center;padding:32px 0;';
    noExif.innerHTML = `
      <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);letter-spacing:.1em;">NO EXIF DATA</div>
      <div style="font-size:12px;color:var(--text-dim);margin-top:8px;line-height:1.5">This image has no embedded<br>camera metadata.</div>
    `;
    meta.appendChild(noExif);
  }

  document.getElementById('lightbox').classList.add('active');
  document.addEventListener('keydown', lbKeydown);

  _runTypewriterHUD();
}

export function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.removeEventListener('keydown', lbKeydown);
}

// ── Private helpers ───────────────────────────────────────────────────────────

function lbKeydown(e) {
  if (e.key === 'Escape') closeLightbox();
}

/** Builds a titled section of key/value rows for the sidebar. */
function _metaSection(title, rows) {
  const sec = document.createElement('div');
  let html = `<div class="meta-section-title">${title}</div>`;
  rows.forEach(r => {
    const cls = r.accent ? 'meta-value meta-accent' : 'meta-value';
    html += `<div class="meta-row"><span class="meta-key">${r.k}</span><span class="${cls}">${r.v}</span></div>`;
  });
  sec.innerHTML = html;
  return sec;
}

/** Cinematic mobile typewriter effect — only fires on screens ≤ 768px. */
function _runTypewriterHUD() {
  if (window.innerWidth > 768) return;

  const metaContainer = document.getElementById('lb-meta');
  const values = metaContainer.querySelectorAll('.meta-value');

  values.forEach((el, index) => {
    const originalText = el.textContent;
    el.textContent = '';
    el.classList.add('typewriter-text');

    setTimeout(() => {
      el.classList.add('typing-cursor');
      let i = 0;

      const typing = setInterval(() => {
        if (i < originalText.length) {
          el.textContent += originalText.charAt(i++);
        } else {
          clearInterval(typing);
          el.classList.remove('typing-cursor');
        }
      }, 35);
    }, index * 400);
  });
}
