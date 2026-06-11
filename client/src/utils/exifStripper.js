/**
 * Strips EXIF metadata from an image by redrawing it on a virtual HTML5 canvas.
 * This inherently drops all non-pixel header data (GPS, camera model, timestamps).
 *
 * @param {File} file - The original image file from the dropzone.
 * @returns {Promise<Blob>} - A promise resolving to the clean image Blob.
 */
export function stripExifData(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      // Create a virtual canvas matching the exact dimensions of the image
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      
      // Draw the raw pixels onto the canvas
      ctx.drawImage(img, 0, 0);

      // Preserve PNGs, otherwise default to JPEG
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      
      // FIX: Apply a 0.90 quality setting for JPEGs to prevent massive file bloat.
      // PNGs ignore the quality parameter.
      const quality = outputType === 'image/jpeg' ? 0.90 : undefined;

      // Export the raw pixels back into a binary Blob
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl); // Prevent memory leaks
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas binary conversion failed.'));
        }
      }, outputType, quality);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image into the privacy scrubber.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Helper function to trigger a native browser download for the scrubbed file.
 */
export function downloadScrubbedImage(blob, originalFileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  // Format the new filename (e.g., photo.jpg -> photo_scrubbed.jpg)
  const nameParts = originalFileName.split('.');
  const ext = nameParts.pop();
  const baseName = nameParts.join('.');
  
  a.href = url;
  a.download = `${baseName}_scrubbed.${ext}`;
  document.body.appendChild(a);
  a.click();
  
  // Clean up the DOM and memory
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}