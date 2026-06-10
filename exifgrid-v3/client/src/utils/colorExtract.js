/**
 * 1×1 canvas color extraction — same trick as vanilla buildCard / openLightbox.
 * Returns { r, g, b } or null. Canvas is created ephemerally (no DOM attachment).
 */
export async function extractDominantColor(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1;
        canvas.height = 1;
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        resolve({ r, g, b });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function glowStyle({ r, g, b }, card = true) {
  if (!r && r !== 0) return {};
  if (card) {
    return {
      '--card-glow': `rgba(${r}, ${g}, ${b}, 0.35)`,
      '--card-glow-shadow': `rgba(${r}, ${g}, ${b}, 0.15)`,
    };
  }
  return {
    background: `radial-gradient(circle at center, rgba(${r},${g},${b},0.15) 0%, transparent 70%)`,
    borderLeftColor: `rgba(${r},${g},${b},0.4)`,
  };
}
