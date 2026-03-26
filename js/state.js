// ─── SHARED STATE ────────────────────────────────────────────────────────────
// Single source of truth — import this wherever photos/exifCount/camerasSet
// are read or mutated so all modules stay in sync.

export const photos     = [];   // Array of photo objects { id, file, src, exif, name, size, naturalW, naturalH }
export let   exifCount  = 0;
export const camerasSet = new Set();

export function setExifCount(n) { exifCount = n; }
