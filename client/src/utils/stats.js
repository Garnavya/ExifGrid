/**
 * Derived stats — replaces vanilla updateStats() DOM writes.
 * App.jsx calls this on every photos[] change and passes results to <StatsBar />.
 */
export function computeStats(photos) {
  const exifCount = photos.filter((p) => p.exif && Object.keys(p.exif).length > 0).length;
  const camerasSet = new Set();

  photos.forEach((p) => {
    if (p.exif?.Make) {
      camerasSet.add(`${p.exif.Make} ${p.exif.Model || ''}`.trim());
    }
  });

  const cameras = Array.from(camerasSet);
  const cameraLabel =
    cameras.length > 0
      ? cameras.slice(0, 3).join(', ') + (cameras.length > 3 ? ` +${cameras.length - 3}` : '')
      : null;

  return { count: photos.length, exifCount, cameraLabel };
}
