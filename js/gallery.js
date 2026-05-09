// ─── GALLERY ──────────────────────────────────────────────────────────────────
// Drag & drop wiring, file ingestion, stats bar, clear-all, and individual
// photo removal all live here.

import { photos, camerasSet, setExifCount } from './state.js';
import { createLoadingCard } from './card.js';
import { readExif } from './exif.js';

// ── Drag & Drop ───────────────────────────────────────────────────────────────

export function onDragOver(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.add('drag-over');
}

export function onDragLeave() {
  document.getElementById('drop-zone').classList.remove('drag-over');
}

export function onDrop(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.remove('drag-over');
  handleFiles(e.dataTransfer.files);
}

// ── File Handling ─────────────────────────────────────────────────────────────

export function handleFiles(files) {
  if (!files || files.length === 0) return;
  _showGallery();

  Array.from(files).forEach((file) => {
    if (!file.type.startsWith('image/')) return;

    // Unique ID for safe async removal
    const id = Math.random().toString(36).substring(2, 9);
    // Lightweight Object URL — avoids keeping a full base64 string in RAM
    const objectURL = URL.createObjectURL(file);

    photos.push({ id, file, src: objectURL, exif: null });

    const card = createLoadingCard();
    document.getElementById('gallery').appendChild(card);

    readExif(file, objectURL, id, card);
  });
  const fileInput = document.getElementById('file-input');
  if (fileInput) fileInput.value = '';
}

// ── Remove a Single Photo ─────────────────────────────────────────────────────

export function removePhoto(id, cardElement) {
  const index = photos.findIndex(p => p.id === id);
  if (index !== -1) {
    URL.revokeObjectURL(photos[index].src); // Free memory immediately
    photos.splice(index, 1);
  }
  cardElement.remove();
  updateStats();
}

// ── Clear All ─────────────────────────────────────────────────────────────────

export function clearAll() {
  photos.forEach(photo => URL.revokeObjectURL(photo.src));
  photos.length = 0;
  document.getElementById('gallery').innerHTML = '';

  const fileInput = document.getElementById('file-input');
  if (fileInput) fileInput.value = '';
  
  updateStats();
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────

export function updateStats() {
  // Recompute from the live photos array
  const newExifCount = photos.filter(p => p.exif && Object.keys(p.exif).length > 0).length;
  setExifCount(newExifCount);

  camerasSet.clear();
  photos.forEach(p => {
    if (p.exif && p.exif.Make) {
      camerasSet.add((p.exif.Make + ' ' + (p.exif.Model || '')).trim());
    }
  });

  document.getElementById('stat-count').textContent = photos.length;
  document.getElementById('stat-exif').textContent = newExifCount;

  const cameraWrap = document.getElementById('stat-camera-wrap');
  if (camerasSet.size > 0) {
    cameraWrap.style.display = 'flex';
    const cams = Array.from(camerasSet).slice(0, 3).join(', ');
    document.getElementById('stat-cameras').textContent =
      cams + (camerasSet.size > 3 ? ` +${camerasSet.size - 3}` : '');
  } else {
    cameraWrap.style.display = 'none';
  }

  // Reset UI when gallery becomes empty
  if (photos.length === 0) {
    document.getElementById('gallery').innerHTML = '';
    _hideGallery();
  }
}

// ── Private UI helpers ────────────────────────────────────────────────────────

function _showGallery() {
  document.getElementById('drop-zone').style.display = 'none';
  document.getElementById('gallery').style.display = 'block';
  document.getElementById('stats-bar').style.display = 'flex';
  document.getElementById('clear-btn').style.display = 'block';
}

function _hideGallery() {
  document.getElementById('drop-zone').style.display = '';
  document.getElementById('gallery').style.display = 'none';
  document.getElementById('stats-bar').style.display = 'none';
  document.getElementById('clear-btn').style.display = 'none';
}
