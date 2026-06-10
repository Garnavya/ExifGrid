/**
 * Pure formatting helpers migrated from vanilla formatters.js.
 * No DOM access — safe to call from any React render or effect.
 */

export function formatAperture(v) {
  if (!v) return null;
  const n = typeof v === 'object' ? v.numerator / v.denominator : v;
  return `f/${n.toFixed(1)}`;
}

export function formatShutter(v) {
  if (!v) return null;
  const n = typeof v === 'object' ? v.numerator / v.denominator : v;
  if (n >= 1) return `${n.toFixed(1)}s`;
  return `1/${Math.round(1 / n)}s`;
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatExifDate(str) {
  if (!str) return '—';
  const parts = str.split(' ');
  if (parts.length < 2) return str;
  const dateParts = parts[0].split(':');
  if (dateParts.length < 3) return str;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const m = parseInt(dateParts[1], 10);
  return `${dateParts[2]} ${months[m - 1] || m} ${dateParts[0]}, ${parts[1]}`;
}

export function convertDMStoDD(dms, ref) {
  if (!dms || dms.length < 3) return 0;
  const d = dms[0].numerator / dms[0].denominator;
  const m = dms[1].numerator / dms[1].denominator;
  const s = dms[2].numerator / dms[2].denominator;
  let dd = d + m / 60 + s / 3600;
  if (ref === 'S' || ref === 'W') dd = -dd;
  return dd;
}
