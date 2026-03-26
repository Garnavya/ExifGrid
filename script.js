// ─── ENTRY POINT ─────────────────────────────────────────────────────────────
// Imports every module and exposes the handful of functions that index.html
// calls directly via inline event attributes (onclick, ondragover, etc.).
// Everything else stays encapsulated inside the ES module graph.

import { handleFiles, clearAll, onDragOver, onDragLeave, onDrop } from './js/gallery.js';
import { closeLightbox } from './js/lightbox.js';

// Attach to window so inline HTML event attributes can still reach them
window.handleFiles = handleFiles;
window.clearAll = clearAll;
window.onDragOver = onDragOver;
window.onDragLeave = onDragLeave;
window.onDrop = onDrop;
window.closeLightbox = closeLightbox;
