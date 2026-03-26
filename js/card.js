// ─── CARD BUILDER ─────────────────────────────────────────────────────────────
// Responsible for creating both the skeleton loading card and the fully-
// populated photo card DOM elements.

import { photos } from './state.js';
import { formatAperture, formatShutter } from './formatters.js';
import { openLightbox } from './lightbox.js';
import { removePhoto } from './gallery.js';

/** Returns a shimmer skeleton placeholder inserted while EXIF loads. */
export function createLoadingCard() {
  const div = document.createElement('div');
  div.className = 'card-loading';
  return div;
}

/**
 * Builds a fully populated photo card for the given photo ID.
 * @param {string} id - Unique photo ID from state.photos
 * @returns {HTMLElement}
 */
export function buildCard(id) {
  const p = photos.find(photo => photo.id === id);
  const idx = photos.findIndex(photo => photo.id === id);

  const exif = p.exif || {};
  const hasExif = Object.keys(exif).length > 0;

  const card = document.createElement('div');
  card.className = 'photo-card';
  card.style.animationDelay = (idx * 40) + 'ms'; // Cascading load animation
  card.onclick = () => openLightbox(id);

  // ── Remove button ──
  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-btn';
  removeBtn.innerHTML = '✕';
  removeBtn.onclick = (e) => {
    e.stopPropagation(); // Prevent lightbox from opening
    removePhoto(id, card);
  };
  card.appendChild(removeBtn);

  // ── Thumbnail ──
  const img = document.createElement('img');
  img.src = p.src;
  img.alt = p.name;
  img.loading = 'lazy';
  card.appendChild(img);

  // ── Camera badge (top-left) ──
  if (exif.Make) {
    const badge = document.createElement('div');
    badge.className = 'camera-badge';
    badge.textContent = (exif.Make + (exif.Model ? ' ' + exif.Model : '')).trim().substring(0, 24);
    card.appendChild(badge);
  }

  // ── Hover overlay ──
  const overlay = document.createElement('div');
  overlay.className = 'photo-overlay';

  const fname = document.createElement('div');
  fname.className = 'photo-filename';
  fname.textContent = p.name;
  overlay.appendChild(fname);

  if (hasExif) {
    const grid = document.createElement('div');
    grid.className = 'exif-grid';

    const fields = [
      { label: 'Aperture', val: formatAperture(exif.FNumber) },
      { label: 'Shutter', val: formatShutter(exif.ExposureTime) },
      { label: 'ISO', val: exif.ISOSpeedRatings ? 'ISO ' + exif.ISOSpeedRatings : null },
      { label: 'Focal', val: exif.FocalLength ? exif.FocalLength.toFixed(0) + 'mm' : null },
    ].filter(f => f.val);

    fields.forEach(f => {
      const item = document.createElement('div');
      item.className = 'exif-item';
      item.innerHTML = `<span class="exif-label">${f.label}</span><span class="exif-val">${f.val}</span>`;
      grid.appendChild(item);
    });

    if (fields.length > 0) {
      overlay.appendChild(grid);
    } else {
      const nb = document.createElement('span');
      nb.className = 'no-exif-badge';
      nb.textContent = 'EXIF found';
      overlay.appendChild(nb);
    }
  } else {
    const nb = document.createElement('span');
    nb.className = 'no-exif-badge';
    nb.textContent = 'No EXIF';
    overlay.appendChild(nb);
  }

  card.appendChild(overlay);
  return card;
}
