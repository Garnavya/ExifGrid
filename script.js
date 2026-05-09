// ─── ENTRY POINT ─────────────────────────────────────────────────────────────
// Imports every module and exposes the handful of functions that index.html
// calls directly via inline event attributes (onclick, ondragover, etc.).
// Everything else stays encapsulated inside the ES module graph.

import { handleFiles, clearAll, onDragOver, onDragLeave, onDrop } from './js/gallery.js';
import { closeLightbox } from './js/lightbox.js';

export function toggleTheme() {
  const htmlDoc = document.documentElement;
  const themeBtn = document.getElementById('theme-btn');
  
  // Toggle the class on the <html> tag
  htmlDoc.classList.toggle('light-theme');
  
  // Update the button text
  if (htmlDoc.classList.contains('light-theme')) {
    themeBtn.textContent = '🌙 Dark';
  } else {
    themeBtn.textContent = '☀️ Light';
  }
}

// Attach to window so inline HTML event attributes can still reach them
window.handleFiles  = handleFiles;
window.clearAll     = clearAll;
window.onDragOver   = onDragOver;
window.onDragLeave  = onDragLeave;
window.onDrop       = onDrop;
window.closeLightbox = closeLightbox;
window.toggleTheme  = toggleTheme;