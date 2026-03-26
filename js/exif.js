// ─── EXIF READING ─────────────────────────────────────────────────────────────
// Reads raw EXIF data from a File object via EXIF.js (global), then hands off
// to the card builder once image dimensions are also known.

import { photos } from './state.js';
import { buildCard } from './card.js';
import { updateStats } from './gallery.js';

/**
 * Kick off async EXIF extraction + dimension measurement for one file.
 * @param {File}        file        - Raw File from the input / drop event
 * @param {string}      src         - Object URL already created for this file
 * @param {string}      id          - Unique ID assigned to this photo
 * @param {HTMLElement} placeholder - Loading-card element to be replaced when done
 */
export function readExif(file, src, id, placeholder) {
  // EXIF.js needs the raw File for fastest processing
  /* global EXIF */
  EXIF.getData(file, function () {
    const data = EXIF.getAllTags(this);

    // Safeguard: photo may have been removed before async callback fires
    const p = photos.find(photo => photo.id === id);
    if (!p) return;

    p.exif = data;
    p.name = file.name;
    p.size = file.size;

    // We still need natural dimensions — load via the lightweight objectURL
    const tempImg = new Image();
    tempImg.onload = function () {
      p.naturalW = tempImg.naturalWidth;
      p.naturalH = tempImg.naturalHeight;

      const card = buildCard(id);
      placeholder.replaceWith(card);
      updateStats();
    };
    tempImg.src = src;
  });
}
