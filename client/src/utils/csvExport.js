import { formatAperture, formatShutter, formatExifDate } from './formatters.js';

/**
 * Generates and downloads a CSV file containing metadata for all loaded photos.
 *
 * @param {Array} photos - The array of photo objects currently in state.
 */
export function exportToCSV(photos) {
  if (!photos || photos.length === 0) return;

  const headers = [
    'Original Name', 'Relative Path', 'Size (Bytes)', 'Width', 'Height',
    'Make', 'Model', 'Lens',
    'Aperture', 'Shutter Speed', 'ISO', 'Focal Length',
    'Date Taken', 'Latitude', 'Longitude'
  ];

  const rows = photos.map((photo) => {
    const e = photo.exif || {};
    
    // Attempt to grab the relative folder path, fallback to just the file name
    const relativePath = photo.file?.webkitRelativePath || photo.name;

    return [
      photo.name,
      relativePath,
      photo.size,
      photo.naturalW,
      photo.naturalH,
      e.Make || 'N/A',
      e.Model || 'N/A',
      e.LensModel || 'N/A',
      e.FNumber ? formatAperture(e.FNumber) : 'N/A',
      e.ExposureTime ? formatShutter(e.ExposureTime) : 'N/A',
      e.ISO || e.ISOSpeedRatings || 'N/A',
      e.FocalLength ? `${Number(e.FocalLength).toFixed(0)}mm` : 'N/A',
      e.DateTimeOriginal ? formatExifDate(e.DateTimeOriginal.toString()) : 'N/A',
      e.latitude !== undefined ? e.latitude.toFixed(5) : 'N/A',
      e.longitude !== undefined ? e.longitude.toFixed(5) : 'N/A'
    ]
      // Wrap each cell in quotes and escape internal quotes to prevent CSV breakage
      .map((val) => {
        const strVal = String(val).replace(/"/g, '""');
        // Prevent CSV Injection by prefixing dangerous characters with a single quote
        if (/^[=+\-@]/.test(strVal)) {
          return `"'${strVal}"`;
        }
        return `"${strVal}"`;
      })
      .join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `exifgrid_metadata_${new Date().getTime()}.csv`;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}